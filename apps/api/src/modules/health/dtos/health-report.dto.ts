import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const healthReportSchema = z.object({
  status: z.enum(['ok', 'error']),
  database: z.enum(['up', 'down']),
})

export type HealthReport = z.infer<typeof healthReportSchema>

export class HealthReportDto extends createZodDto(healthReportSchema) {}
