import { ApiError } from '@/shared/lib/api-error'

/** Same keys as `CreateServerError` in the dialog View. */
type CreateServerFormError = 'limitReached' | 'unexpected'

/** Maps a failed `POST /servers` to the key the dialog shows. */
function mapCreateServerError(error: unknown): CreateServerFormError {
  if (error instanceof ApiError && error.code === 'SERVER_LIMIT_REACHED') return 'limitReached'
  return 'unexpected'
}

export { mapCreateServerError }
export type { CreateServerFormError }
