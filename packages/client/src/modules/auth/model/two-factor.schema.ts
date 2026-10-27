import { z } from 'zod'

const TOTP_LENGTH = 6

/** Mensagens dos schemas: chaves de `auth.errors`, a View traduz. */
type TwoFactorCodeError = 'required' | 'twoFactorCodeIncomplete'

const message = (key: TwoFactorCodeError) => key

/** Código do app autenticador. Usado no login (F2) e na configuração do 2FA do admin (F12.1). */
const totpCodeSchema = z.object({
  code: z.string().regex(new RegExp(`^\\d{${TOTP_LENGTH}}$`), message('twoFactorCodeIncomplete')),
})

const recoveryCodeSchema = z.object({
  code: z.string().trim().min(1, message('required')),
})

type TwoFactorCodeValues = z.infer<typeof totpCodeSchema>

export { recoveryCodeSchema, TOTP_LENGTH, totpCodeSchema }
export type { TwoFactorCodeError, TwoFactorCodeValues }
