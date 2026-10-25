import { z } from 'zod'

/** O Better Auth pede a senha para ligar o 2FA. Mensagem: chave de `auth.errors`. */
const confirmPasswordSchema = z.object({ password: z.string().min(1, 'required') })

type ConfirmPasswordValues = z.infer<typeof confirmPasswordSchema>

export { confirmPasswordSchema }
export type { ConfirmPasswordValues }
