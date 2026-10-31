import { describe, expect, it, vi } from 'vitest'

import { createDiagnosticsModule } from './diagnostics.module'
import { LocalMcpServer } from './mcp.module'

const status = { diagnostics: true, cdpPort: 9223, mainInspectPort: 9229, devtools: true }

describe('LocalMcpServer', () => {
  it('binds only on loopback and requires the temporary bearer token', async () => {
    const diagnostics = createDiagnosticsModule({ enabled: true, status })
    const server = new LocalMcpServer(diagnostics.collector)
    const active = await server.start()
    const endpoint = active.endpoint!

    await expect(fetch(endpoint)).resolves.toMatchObject({ status: 401 })
    await expect(fetch(endpoint, { headers: { Authorization: `Bearer ${active.token}` } })).resolves.toMatchObject({
      status: 404,
    })

    const stopped = await server.stop()
    expect(stopped).toMatchObject({ state: 'inactive', endpoint: null, token: null, configuration: null, clients: [] })
    await expect(fetch(endpoint, { headers: { Authorization: `Bearer ${active.token}` } })).rejects.toThrow()
  })

  it('serves a bounded diagnostics tool set after MCP initialization', async () => {
    const diagnostics = createDiagnosticsModule({ enabled: true, status })
    diagnostics.collector.record({
      name: 'lifecycle.state.changed',
      attemptId: 'attempt-1',
      at: new Date().toISOString(),
      data: { state: 'started', detail: null },
    })
    const server = new LocalMcpServer(diagnostics.collector)
    const active = await server.start()
    const response = await fetch(active.endpoint!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${active.token}`,
        Accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } },
      }),
    })
    expect(response.status).toBe(200)
    const initialized = (await response.json()) as { result: { serverInfo: { name: string } } }
    expect(initialized.result.serverInfo.name).toBe('gameplay-local-diagnostics')
    const sessionId = response.headers.get('mcp-session-id')
    expect(sessionId).toBeTruthy()
    const toolsResponse = await fetch(active.endpoint!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${active.token}`,
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-06-18',
        'Mcp-Session-Id': sessionId!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    })
    expect(toolsResponse.status).toBe(200)
    const tools = (await toolsResponse.json()) as { result: { tools: { name: string }[] } }
    expect(tools.result.tools.map(({ name }) => name)).toEqual([
      'diagnostics_status',
      'diagnostics_recent_events',
      'diagnostics_summary',
    ])
    expect(server.status().tools).toEqual([
      { key: 'diagnostics_status', description: 'Returns the effective local desktop diagnostics configuration.' },
      { key: 'diagnostics_recent_events', description: 'Returns the bounded, sanitized local diagnostics history.' },
      {
        key: 'diagnostics_summary',
        description: 'Returns counts of recent diagnostic event names without session content.',
      },
    ])
    expect(server.status().clients[0]).toMatchObject({ name: 'test', version: '1.0.0' })
    await server.stop()
  })

  it('exposes public tools only when the public gateway is configured', async () => {
    const request = vi.fn().mockResolvedValue({ items: [] })
    const diagnostics = createDiagnosticsModule({ enabled: true, status })
    const server = new LocalMcpServer(diagnostics.collector, { request })
    const active = await server.start()
    const initialize = await fetch(active.endpoint!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${active.token}`,
        Accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'public-test', version: '1.0.0' },
        },
      }),
    })
    const sessionId = initialize.headers.get('mcp-session-id')!
    const toolsResponse = await fetch(active.endpoint!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${active.token}`,
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-06-18',
        'Mcp-Session-Id': sessionId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    })
    const tools = (await toolsResponse.json()) as { result: { tools: { name: string }[] } }
    expect(tools.result.tools.map(({ name }) => name)).toContain('public_update_changelog')
    expect(server.status().tools.map(({ key }) => key)).toContain('public_moderate_feature_request')

    await fetch(active.endpoint!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${active.token}`,
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-06-18',
        'Mcp-Session-Id': sessionId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'public_list_roadmap', arguments: {} },
      }),
    })
    expect(request).toHaveBeenCalledWith('/admin/public/roadmap')
    await server.stop()
  })
})
