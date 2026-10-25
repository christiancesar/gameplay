import { REGISTRATION_KEY_ALPHABET, REGISTRATION_KEY_LENGTH } from '@gameplay/contracts'
import { z } from 'zod'

import { passwordSchema } from '@/modules/auth/model/password.schema'
import { usernameSchema } from '@/modules/auth/model/username.schema'

const INVITE_KEY_LENGTH = REGISTRATION_KEY_LENGTH
/** Caracteres aceitos na key, em qualquer caixa: o alfabeto não tem 0/O nem 1/I. */
const INVITE_KEY_PATTERN = `^[${REGISTRATION_KEY_ALPHABET}${REGISTRATION_KEY_ALPHABET.toLowerCase()}]+$`

/** Mensagens dos schemas: chaves de `auth.errors`, a View traduz. */
type SignUpValidationError =
  | 'required'
  | 'usernameInvalid'
  | 'emailInvalid'
  | 'passwordTooShort'
  | 'passwordMismatch'
  | 'inviteKeyIncomplete'
  | 'inviteKeyInvalid'

/**
 * Erros que só o servidor conhece. Key inexistente, expirada, revogada ou já usada
 * voltam todas como `inviteKeyInvalid` (o backend não diz qual, de propósito).
 */
type SignUpServerError = 'usernameTaken' | 'emailTaken' | 'inviteKeyInvalid' | 'tooManyAttempts'

type SignUpFieldError = SignUpValidationError | SignUpServerError

const message = (key: SignUpValidationError) => key

const signUpSchema = z
  .object({
    username: usernameSchema,
    email: z
      .string()
      .trim()
      .min(1, message('required'))
      .pipe(z.email(message('emailInvalid'))),
    password: passwordSchema,
    confirmPassword: z.string().min(1, message('required')),
    inviteKey: z
      .string()
      .min(1, message('required'))
      .length(INVITE_KEY_LENGTH, message('inviteKeyIncomplete'))
      .regex(new RegExp(INVITE_KEY_PATTERN), message('inviteKeyInvalid'))
      .transform((value) => value.toUpperCase()),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: message('passwordMismatch'),
  })

type SignUpInput = z.input<typeof signUpSchema>
type SignUpValues = z.output<typeof signUpSchema>
type SignUpField = keyof SignUpInput

export { INVITE_KEY_LENGTH, INVITE_KEY_PATTERN, signUpSchema }
export type { SignUpField, SignUpFieldError, SignUpInput, SignUpServerError, SignUpValues }
