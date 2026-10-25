import { ApiError } from '@/shared/lib/api-error'

/** 403 (not a member) and 404 (deleted) on the server detail: the user has nothing to see here. */
function isServerUnavailable(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

export { isServerUnavailable }
