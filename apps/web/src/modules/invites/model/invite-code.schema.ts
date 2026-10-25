import { REGISTRATION_KEY_ALPHABET, SERVER_INVITE_CODE_LENGTH } from '@gameplay/contracts'
import { z } from 'zod'

/** Mensagens dos schemas: chaves de `hub.joinErrors`, a View traduz. */
type InviteCodeError = 'codeRequired' | 'codeInvalid'

const CODE_PATTERN = new RegExp(`^[${REGISTRATION_KEY_ALPHABET}]{${SERVER_INVITE_CODE_LENGTH}}$`)

/** Aceita o código ou o link do convite (`.../i/<CODE>`): fica o último trecho do caminho. */
function codeFromInput(input: string) {
  const path = input.split(/[?#]/)[0]
  return (path.split('/').filter(Boolean).pop() ?? '').toUpperCase()
}

/** Código de convite digitado no Hub (F4). Espaços nas pontas saem; vai em maiúsculas. */
const inviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'codeRequired' satisfies InviteCodeError)
    .transform(codeFromInput)
    .pipe(z.string().regex(CODE_PATTERN, 'codeInvalid' satisfies InviteCodeError)),
})

type InviteCodeInput = z.input<typeof inviteCodeSchema>
type InviteCodeValues = z.output<typeof inviteCodeSchema>

export { inviteCodeSchema }
export type { InviteCodeError, InviteCodeInput, InviteCodeValues }
