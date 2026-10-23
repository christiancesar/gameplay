import { z } from 'zod'

const PASSWORD_MIN = 8

/** Mensagens: chaves de `auth.errors`. Mesma regra no cadastro e no reset feito pelo admin. */
const passwordSchema = z.string().min(1, 'required').min(PASSWORD_MIN, 'passwordTooShort')

export { PASSWORD_MIN, passwordSchema }
