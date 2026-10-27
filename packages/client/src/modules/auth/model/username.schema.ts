import { USERNAME_PATTERN } from '@gameplay/contracts'
import { z } from 'zod'

/** Mensagens: chaves de `auth.errors`. Mesma regra no cadastro e na troca pelo perfil. */
const usernameSchema = z.string().trim().min(1, 'required').regex(USERNAME_PATTERN, 'usernameInvalid')

export { usernameSchema }
