import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const componentStatusSchema = z.enum(['operational', 'degraded', 'outage'])

const componentSchema = z.object({
  status: componentStatusSchema,
  latencyMs: z.number().int().nonnegative(),
})

// Public: statuses and timings only, never hosts, addresses or error messages.
export const healthDetailsSchema = z.object({
  status: componentStatusSchema,
  checkedAt: z.iso.datetime(),
  components: z.object({
    database: componentSchema,
    storage: componentSchema,
    // Missing when the server has no TURN relay (STUN only).
    turn: componentSchema.optional(),
  }),
})

export type HealthDetails = z.infer<typeof healthDetailsSchema>

export class HealthDetailsDto extends createZodDto(healthDetailsSchema) {}
