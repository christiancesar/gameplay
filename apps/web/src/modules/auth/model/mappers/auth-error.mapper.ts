import type { SignInFormError } from '@/modules/auth/model/entities/sign-in-form-error'
import type { SignUpFormError } from '@/modules/auth/model/entities/sign-up-form-error'
import type { TwoFactorFormError } from '@/modules/auth/model/entities/two-factor-form-error'
import type { SignUpField, SignUpServerError } from '@/modules/auth/model/sign-up.schema'

/** Error shape returned by the Better Auth client (`{ code, message, status }`). */
type AuthClientError = { code?: string; message?: string; status?: number }

type SignUpErrors = {
  fieldErrors?: Partial<Record<SignUpField, SignUpServerError>>
  formError?: SignUpFormError
}

const TOO_MANY_REQUESTS = 429

/** Better Auth admin plugin, thrown for a banned account on sign-in. */
const BANNED_USER = 'BANNED_USER'
/** Better Auth two-factor plugin. */
const INVALID_CODE = 'INVALID_CODE'
const INVALID_BACKUP_CODE = 'INVALID_BACKUP_CODE'
const INVALID_TWO_FACTOR_COOKIE = 'INVALID_TWO_FACTOR_COOKIE'
/** Better Auth username plugin and base sign-up. */
const USERNAME_IS_ALREADY_TAKEN = 'USERNAME_IS_ALREADY_TAKEN'
const USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS'
const USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL = 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
/** API sign-up hook (apps/api/src/modules/auth/hooks/sign-up.hook.ts). */
const INVALID_REGISTRATION_KEY = 'INVALID_REGISTRATION_KEY'

/** No response (network) or a server failure: not something the person typed wrong. */
function isUnreachable(error: AuthClientError): boolean {
  return !error.status || error.status >= 500
}

function mapSignInError(error: AuthClientError): SignInFormError {
  if (error.status === TOO_MANY_REQUESTS) return 'tooManyAttempts'
  if (error.code === BANNED_USER) return 'accountSuspended'
  if (isUnreachable(error)) return 'unexpected'
  return 'invalidCredentials'
}

/** Shared by the authenticator code and the recovery code steps. */
function mapTwoFactorError(error: AuthClientError): TwoFactorFormError {
  if (error.status === TOO_MANY_REQUESTS) return 'tooManyAttempts'
  if (error.code === INVALID_CODE || error.code === INVALID_BACKUP_CODE) return 'invalidTwoFactorCode'
  return 'unexpected'
}

/** The short-lived 2FA cookie is gone, so the code can no longer be checked. */
function isTwoFactorSessionLost(error: AuthClientError): boolean {
  return error.code === INVALID_TWO_FACTOR_COOKIE
}

function mapSignUpError(error: AuthClientError): SignUpErrors {
  if (error.status === TOO_MANY_REQUESTS) return { fieldErrors: { inviteKey: 'tooManyAttempts' } }
  switch (error.code) {
    case INVALID_REGISTRATION_KEY:
      return { fieldErrors: { inviteKey: 'inviteKeyInvalid' } }
    case USERNAME_IS_ALREADY_TAKEN:
      return { fieldErrors: { username: 'usernameTaken' } }
    case USER_ALREADY_EXISTS:
    case USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      return { fieldErrors: { email: 'emailTaken' } }
    default:
      return { formError: 'unexpected' }
  }
}

export { isTwoFactorSessionLost, mapSignInError, mapSignUpError, mapTwoFactorError }
export type { AuthClientError, SignUpErrors }
