import { z } from 'zod'

const CONNECTIONS = ['ethernet', 'wifi', 'mobile'] as const

/** Mensagens dos schemas: chaves de `hardware.manual.errors`, a View traduz. */
type ManualHardwareError = 'positiveNumber'

/** Campo opcional digitado como texto ("16" ou "16,5"). Vazio vira undefined; o resto precisa ser número maior que zero. */
const optionalPositiveNumber = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : Number(value.replace(',', '.'))))
  .refine(
    (value) => value === undefined || (Number.isFinite(value) && value > 0),
    'positiveNumber' satisfies ManualHardwareError,
  )

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined)

/** Complemento manual do hardware (F11): tudo opcional, o usuário preenche o que souber. */
const manualHardwareSchema = z.object({
  cpuModel: optionalText,
  ramGb: optionalPositiveNumber,
  gpuModel: optionalText,
  vramGb: optionalPositiveNumber,
  connection: z
    .enum(CONNECTIONS)
    .or(z.literal(''))
    .transform((value) => value || undefined),
  downloadMbps: optionalPositiveNumber,
  uploadMbps: optionalPositiveNumber,
})

type ManualHardwareInput = z.input<typeof manualHardwareSchema>
type ManualHardware = z.output<typeof manualHardwareSchema>
type ManualHardwareField = keyof ManualHardwareInput

export { CONNECTIONS, manualHardwareSchema }
export type { ManualHardware, ManualHardwareError, ManualHardwareField, ManualHardwareInput }
