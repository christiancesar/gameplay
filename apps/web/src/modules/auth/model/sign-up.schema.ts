import { z } from 'zod'

import { passwordSchema } from '@/modules/auth/model/password.schema'

const INVITE_KEY_LENGTH = 6

/** Mensagens dos schemas: chaves de `auth.errors`, a View traduz. */
type SignUpValidationError =
  | 'required'
  | 'usernameInvalid'
  | 'emailInvalid'
  | 'passwordTooShort'
  | 'passwordMismatch'
  | 'inviteKeyIncomplete'

/** Erros que só o servidor conhece. */
type SignUpServerError =
  | 'usernameTaken'
  | 'emailTaken'
  | 'inviteKeyInvalid'
  | 'inviteKeyExpired'
  | 'inviteKeyRevoked'
  | 'inviteKeyUsed'
  | 'tooManyAttempts'

type SignUpFieldError = SignUpValidationError | SignUpServerError

const message = (key: SignUpValidationError) => key

const signUpSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, message('required'))
      .regex(/^[a-zA-Z0-9._-]{3,32}$/, message('usernameInvalid')),
    email: z.string().trim().min(1, message('required')).pipe(z.email(message('emailInvalid'))),
    password: passwordSchema,
    confirmPassword: z.string().min(1, message('required')),
    inviteKey: z
      .string()
      .min(1, message('required'))
      .length(INVITE_KEY_LENGTH, message('inviteKeyIncomplete'))
      .transform((value) => value.toUpperCase()),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: message('passwordMismatch'),
  })

type SignUpInput = z.input<typeof signUpSchema>
type SignUpValues = z.output<typeof signUpSchema>
type SignUpField = keyof SignUpInput

export { INVITE_KEY_LENGTH, signUpSchema }
export type { SignUpField, SignUpFieldError, SignUpInput, SignUpServerError, SignUpValues }
