import { ApiError } from '@/shared/lib/api-error'

/** Keys of `admin.errors`. */
type AdminError = 'twoFactorRequired' | 'cannotSuspendSelf' | 'notFound' | 'unexpected'

/** Maps a failed admin request to the key of the toast. */
function mapAdminError(error: unknown): AdminError {
  if (!(error instanceof ApiError)) return 'unexpected'
  if (error.code === 'TWO_FACTOR_REQUIRED') return 'twoFactorRequired'
  if (error.code === 'CANNOT_SUSPEND_SELF') return 'cannotSuspendSelf'
  if (error.status === 404) return 'notFound'
  return 'unexpected'
}

export { mapAdminError }
export type { AdminError }
