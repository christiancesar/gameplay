import { z } from 'zod'

/** Período personalizado do consumo, em dias UTC. Mensagens: chaves de `admin.media.usage.range.errors`. */
const usageRangeSchema = z
  .object({ from: z.iso.date('required'), to: z.iso.date('required') })
  .refine((range) => range.from <= range.to, { message: 'order', path: ['to'] })

type UsageRangeValues = z.infer<typeof usageRangeSchema>

export { usageRangeSchema }
export type { UsageRangeValues }
