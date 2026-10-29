import { z } from 'zod'

const mcpStateSchema = z.enum(['inactive', 'starting', 'active', 'unavailable'])
const mcpStatusSchema = z.object({
  state: mcpStateSchema,
  endpoint: z.string().url().nullable(),
  token: z.string().min(32).nullable(),
  configuration: z.string().nullable(),
})

type McpState = z.infer<typeof mcpStateSchema>
type McpStatus = z.infer<typeof mcpStatusSchema>

export { mcpStateSchema, mcpStatusSchema }
export type { McpState, McpStatus }
