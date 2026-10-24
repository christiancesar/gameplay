import { z } from 'zod'

/** Mensagens dos schemas: chaves de `hub.joinErrors`, a View traduz. */
type InviteCodeError = 'codeRequired'

/** Código de convite digitado no Hub (F4). Espaços nas pontas saem; vai em maiúsculas. */
const inviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'codeRequired' satisfies InviteCodeError)
    .transform((code) => code.toUpperCase()),
})

type InviteCodeInput = z.input<typeof inviteCodeSchema>
type InviteCodeValues = z.output<typeof inviteCodeSchema>

export { inviteCodeSchema }
export type { InviteCodeError, InviteCodeInput, InviteCodeValues }
