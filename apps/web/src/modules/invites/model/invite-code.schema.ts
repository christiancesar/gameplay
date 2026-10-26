import { REGISTRATION_KEY_ALPHABET, SERVER_INVITE_CODE_LENGTH } from '@gameplay/contracts'
import { z } from 'zod'

import { extractInviteCode } from './rules/parse-invite-code'

/** Mensagens dos schemas: chaves de `hub.joinErrors`, a View traduz. */
type InviteCodeError = 'codeRequired' | 'codeInvalid'

const CODE_PATTERN = new RegExp(`^[${REGISTRATION_KEY_ALPHABET}]{${SERVER_INVITE_CODE_LENGTH}}$`)

/** Código de convite digitado no Hub (F4). Espaços nas pontas saem; vai em maiúsculas. */
const inviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'codeRequired' satisfies InviteCodeError)
    .transform(extractInviteCode)
    .pipe(z.string().regex(CODE_PATTERN, 'codeInvalid' satisfies InviteCodeError)),
})

type InviteCodeInput = z.input<typeof inviteCodeSchema>
type InviteCodeValues = z.output<typeof inviteCodeSchema>

export { inviteCodeSchema }
export type { InviteCodeError, InviteCodeInput, InviteCodeValues }
