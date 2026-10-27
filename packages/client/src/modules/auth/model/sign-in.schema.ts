import { z } from 'zod'

/** Mensagens dos schemas: chaves de `auth.errors`, a View traduz. */
type SignInFieldError = 'required'

const message = (key: SignInFieldError) => key

const signInCredentialsSchema = z.object({
  identifier: z.string().trim().min(1, message('required')),
  password: z.string().min(1, message('required')),
})

type SignInCredentials = z.infer<typeof signInCredentialsSchema>

export { signInCredentialsSchema }
export type { SignInCredentials, SignInFieldError }
