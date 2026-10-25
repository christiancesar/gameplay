import { PASSWORD_MIN_LENGTH } from '@gameplay/contracts'
import { z } from 'zod'

/** Mensagens: chaves de `auth.errors`. Mesma regra no cadastro e no reset feito pelo admin. */
const passwordSchema = z.string().min(1, 'required').min(PASSWORD_MIN_LENGTH, 'passwordTooShort')

export { passwordSchema }
