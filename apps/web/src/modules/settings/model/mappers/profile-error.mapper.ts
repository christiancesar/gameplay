import { ApiError } from '@/shared/lib/api-error'

const USERNAME_TAKEN_PREFIX = 'USERNAME_IS_ALREADY_TAKEN'
const INVALID_PASSWORD = 'INVALID_PASSWORD'

const codeOf = (error: unknown) => (error instanceof ApiError ? error.code : undefined)

/** `unexpected` has no field in the form: the ViewModel shows a toast. */
function mapUsernameError(error: unknown): 'usernameTaken' | 'unexpected' {
  return codeOf(error)?.startsWith(USERNAME_TAKEN_PREFIX) ? 'usernameTaken' : 'unexpected'
}

function mapChangePasswordError(error: unknown): 'invalidPassword' | 'unexpected' {
  return codeOf(error) === INVALID_PASSWORD ? 'invalidPassword' : 'unexpected'
}

export { mapChangePasswordError, mapUsernameError }
