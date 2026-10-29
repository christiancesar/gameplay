import { z } from 'zod'

const mcpStateSchema = z.enum(['inactive', 'starting', 'active', 'unavailable'])
const mcpToolSchema = z.object({
  key: z.string().min(1),
  description: z.string().min(1),
})
const mcpClientSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  connectedAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
})
const mcpStatusSchema = z.object({
  state: mcpStateSchema,
  endpoint: z.string().url().nullable(),
  token: z.string().min(32).nullable(),
  configuration: z.string().nullable(),
  tools: z.array(mcpToolSchema),
  clients: z.array(mcpClientSchema),
})

type McpState = z.infer<typeof mcpStateSchema>
type McpTool = z.infer<typeof mcpToolSchema>
type McpClient = z.infer<typeof mcpClientSchema>
type McpStatus = z.infer<typeof mcpStatusSchema>

export { mcpClientSchema, mcpStateSchema, mcpStatusSchema, mcpToolSchema }
export type { McpClient, McpState, McpStatus, McpTool }
