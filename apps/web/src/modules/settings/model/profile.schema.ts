import { z } from 'zod'

import { passwordSchema } from '@/modules/auth/model/password.schema'
import { usernameSchema } from '@/modules/auth/model/username.schema'

/** Mensagens dos schemas: chaves de `auth.errors`, a View traduz. */
type ProfileValidationError = 'required' | 'usernameInvalid' | 'passwordTooShort' | 'passwordMismatch'

/** Erros que só o servidor conhece. `invalidPassword`: a senha atual não confere. */
type ProfileServerError = 'usernameTaken' | 'invalidPassword'

const usernameFormSchema = z.object({ username: usernameSchema })

/** O e-mail só muda pelo admin da plataforma; a senha exige a atual. */
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'required' satisfies ProfileValidationError),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'required' satisfies ProfileValidationError),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch' satisfies ProfileValidationError,
  })

type UsernameFormValues = z.infer<typeof usernameFormSchema>
type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export { changePasswordSchema, usernameFormSchema }
export type { ChangePasswordValues, ProfileServerError, ProfileValidationError, UsernameFormValues }
