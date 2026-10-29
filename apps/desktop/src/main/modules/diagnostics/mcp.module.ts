import { randomBytes, randomUUID } from 'node:crypto'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import type { McpStatus } from '@gameplay/contracts'
import { z } from 'zod'

import type { DiagnosticsCollector } from './diagnostics.module'

type McpSession = { server: McpServer; transport: StreamableHTTPServerTransport }

const MAX_BODY_BYTES = 1_000_000
const MCP_PATH = '/mcp'

function isLoopback(address: string | undefined): boolean {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.byteLength
    if (size > MAX_BODY_BYTES) throw new Error('MCP request body is too large')
    chunks.push(buffer)
  }
  if (chunks.length === 0) return undefined
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function writeJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify(body))
}

function createMcpServer(collector: DiagnosticsCollector): McpServer {
  const server = new McpServer({ name: 'gameplay-local-diagnostics', version: '0.1.0' }, { maxToolInputElements: 16 })
  server.registerTool(
    'diagnostics_status',
    {
      description: 'Returns the effective local desktop diagnostics configuration.',
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => ({ content: [{ type: 'text', text: JSON.stringify(collector.status) }] }),
  )
  server.registerTool(
    'diagnostics_recent_events',
    {
      description: 'Returns the bounded, sanitized local diagnostics history.',
      inputSchema: { limit: z.number().int().min(1).max(100).optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ limit = 50 }) => ({
      content: [{ type: 'text', text: JSON.stringify(collector.history().slice(-limit)) }],
    }),
  )
  server.registerTool(
    'diagnostics_summary',
    {
      description: 'Returns counts of recent diagnostic event names without session content.',
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      const counts = new Map<string, number>()
      for (const event of collector.history()) counts.set(event.name, (counts.get(event.name) ?? 0) + 1)
      return { content: [{ type: 'text', text: JSON.stringify(Object.fromEntries(counts)) }] }
    },
  )
  return server
}

class LocalMcpServer {
  private http: Server | null = null
  private readonly sessions = new Map<string, McpSession>()
  private token: string | null = null
  private currentStatus: McpStatus = { state: 'inactive', endpoint: null, token: null, configuration: null }

  private readonly collector: DiagnosticsCollector

  constructor(collector: DiagnosticsCollector) {
    this.collector = collector
  }

  status(): McpStatus {
    return this.currentStatus
  }

  async start(): Promise<McpStatus> {
    if (this.http) return this.currentStatus
    this.currentStatus = { state: 'starting', endpoint: null, token: null, configuration: null }
    this.token = randomBytes(32).toString('hex')
    this.http = createServer((request, response) => void this.handle(request, response))
    try {
      await new Promise<void>((resolve, reject) => {
        this.http?.once('error', reject)
        this.http?.listen(0, '127.0.0.1', () => resolve())
      })
      const address = this.http.address()
      if (!address || typeof address === 'string') throw new Error('MCP server did not expose a TCP address')
      const endpoint = `http://127.0.0.1:${address.port}${MCP_PATH}`
      this.currentStatus = {
        state: 'active',
        endpoint,
        token: this.token,
        configuration: JSON.stringify({ url: endpoint, headers: { Authorization: `Bearer ${this.token}` } }),
      }
      return this.currentStatus
    } catch (error) {
      this.http?.close()
      this.http = null
      this.token = null
      this.currentStatus = { state: 'unavailable', endpoint: null, token: null, configuration: null }
      throw error
    }
  }

  async stop(): Promise<McpStatus> {
    for (const session of this.sessions.values()) {
      await session.server.close().catch(() => undefined)
      await session.transport.close().catch(() => undefined)
    }
    this.sessions.clear()
    await new Promise<void>((resolve) => {
      if (!this.http) return resolve()
      this.http.close(() => resolve())
    })
    this.http = null
    this.token = null
    this.currentStatus = { state: 'inactive', endpoint: null, token: null, configuration: null }
    return this.currentStatus
  }

  private authorized(request: IncomingMessage): boolean {
    return (
      isLoopback(request.socket.remoteAddress) &&
      request.headers.authorization === `Bearer ${this.token}` &&
      request.url === MCP_PATH
    )
  }

  private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (!this.authorized(request)) return writeJson(response, 401, { error: 'Unauthorized' })
    if (!this.http || !this.token) return writeJson(response, 503, { error: 'MCP server is not active' })
    try {
      const body = request.method === 'POST' ? await readJsonBody(request) : undefined
      const sessionId = request.headers['mcp-session-id']
      let session = typeof sessionId === 'string' ? this.sessions.get(sessionId) : undefined
      if (!session && request.method === 'POST' && isInitializeRequest(body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: randomUUID,
          onsessioninitialized: (id) => {
            const pending = transport
            this.sessions.set(id, { server: mcpServer, transport: pending })
          },
          onsessionclosed: (id) => {
            this.sessions.delete(id)
          },
          enableJsonResponse: true,
        })
        const mcpServer = createMcpServer(this.collector)
        transport.onclose = () => {
          if (transport.sessionId) this.sessions.delete(transport.sessionId)
        }
        await mcpServer.connect(transport)
        await transport.handleRequest(request, response, body)
        return
      }
      if (!session) return writeJson(response, 404, { error: 'MCP session not found' })
      await session.transport.handleRequest(request, response, body)
    } catch (error) {
      if (!response.headersSent)
        writeJson(response, 500, { error: error instanceof Error ? error.message : 'MCP request failed' })
    }
  }
}

function createMcpModule(collector: DiagnosticsCollector) {
  const server = new LocalMcpServer(collector)
  return {
    server,
    handlers: {
      'mcp:status': () => server.status(),
      'mcp:start': () => server.start(),
      'mcp:stop': () => server.stop(),
    },
  }
}

export { LocalMcpServer, createMcpModule }
