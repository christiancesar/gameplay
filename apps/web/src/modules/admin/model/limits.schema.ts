import { z } from 'zod'

/** Mensagens dos schemas: chaves de `admin.limits.errors`, a View traduz. */
type LimitError = 'atLeastOne' | 'atLeastZero'

const message = (key: LimitError) => key

const limitValue = (min: 0 | 1) => {
  const error = message(min === 1 ? 'atLeastOne' : 'atLeastZero')
  return z.number({ error }).int(error).min(min, error)
}

/**
 * Configurações globais (2.2), o `PlatformSettings` da API: todo limite vale pelo menos 1.
 * `minChromiumVersion` é a versão abaixo da qual o app avisa que o navegador está desatualizado.
 */
const globalLimitsSchema = z.object({
  serversPerUser: limitValue(1),
  membersPerServer: limitValue(1),
  roomsPerServer: limitValue(1),
  minChromiumVersion: limitValue(1),
})

/**
 * Override por usuário ou servidor, por id do limite. Sem `custom`, vale o padrão global (sai `undefined`).
 * Zero é permitido: bloqueia o recurso para aquele usuário ou servidor.
 */
const limitOverridesSchema = z
  .record(
    z.string(),
    z.discriminatedUnion('custom', [
      z.object({ custom: z.literal(false), value: z.unknown() }),
      z.object({ custom: z.literal(true), value: limitValue(0) }),
    ]),
  )
  .transform((overrides) =>
    Object.fromEntries(Object.entries(overrides).map(([id, entry]) => [id, entry.custom ? entry.value : undefined])),
  )

type GlobalLimits = z.infer<typeof globalLimitsSchema>
type GlobalLimitField = keyof GlobalLimits
type LimitOverridesInput = z.input<typeof limitOverridesSchema>
type LimitOverrides = z.output<typeof limitOverridesSchema>

export { globalLimitsSchema, limitOverridesSchema }
export type { GlobalLimitField, GlobalLimits, LimitError, LimitOverrides, LimitOverridesInput }
