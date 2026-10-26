import { ApiError } from '@/shared/lib/api-error'

/** Keys of `serverSettings.errors`. */
type ServerSettingsError =
  | 'memberLimitReached'
  | 'roomLimitReached'
  | 'roomNameTaken'
  | 'roomNotFound'
  | 'permissionDenied'
  | 'requestGone'
  | 'memberNotFound'
  | 'inviteNotFound'
  | 'unexpected'

const BY_CODE: Record<string, ServerSettingsError> = {
  MEMBER_LIMIT_REACHED: 'memberLimitReached',
  ROOM_LIMIT_REACHED: 'roomLimitReached',
  ROOM_NAME_TAKEN: 'roomNameTaken',
  ROOM_NOT_FOUND: 'roomNotFound',
  SERVER_PERMISSION_DENIED: 'permissionDenied',
  JOIN_REQUEST_NOT_FOUND: 'requestGone',
  JOIN_REQUEST_DECIDED: 'requestGone',
  MEMBER_NOT_FOUND: 'memberNotFound',
  SERVER_INVITE_NOT_FOUND: 'inviteNotFound',
}

/** Maps a failed server settings call to the toast message key. */
function mapServerSettingsError(error: unknown): ServerSettingsError {
  if (error instanceof ApiError) return BY_CODE[error.code] ?? 'unexpected'
  return 'unexpected'
}

export { mapServerSettingsError }
export type { ServerSettingsError }
