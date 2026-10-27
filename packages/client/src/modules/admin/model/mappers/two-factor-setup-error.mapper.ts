import type { AuthClientError } from '@/modules/auth/model/mappers/auth-error.mapper'

/** Where the error shows: the password field, the code field, or a toast (`auth.errors` key). */
type TwoFactorSetupError =
  | { target: 'password' }
  | { target: 'code' }
  | { target: 'toast'; key: 'tooManyAttempts' | 'unexpected' }

const TOO_MANY_REQUESTS = 429
/** Better Auth two-factor plugin. */
const INVALID_PASSWORD = 'INVALID_PASSWORD'
const INVALID_CODE = 'INVALID_CODE'

function mapTwoFactorSetupError(error: AuthClientError): TwoFactorSetupError {
  if (error.status === TOO_MANY_REQUESTS) return { target: 'toast', key: 'tooManyAttempts' }
  if (error.code === INVALID_PASSWORD) return { target: 'password' }
  if (error.code === INVALID_CODE) return { target: 'code' }
  return { target: 'toast', key: 'unexpected' }
}

export { mapTwoFactorSetupError }
export type { TwoFactorSetupError }
