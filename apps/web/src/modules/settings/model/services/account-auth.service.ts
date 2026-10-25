import { ApiError } from '@/shared/lib/api-error'
import { authClient } from '@/shared/lib/auth-client'

type AuthClientResult = { error: { code?: string; message?: string; status?: number } | null }

/** The Better Auth client resolves with `{ error }`; the mutations want a throw. */
function unwrap(result: AuthClientResult): void {
  const { error } = result
  if (error) throw new ApiError({ code: error.code ?? 'UNKNOWN_ERROR', message: error.message ?? '' }, error.status)
}

/**
 * `/update-user`. The username plugin stores `username` in lower case and keeps
 * `displayUsername` as typed, so both go in the same call.
 */
async function updateUsername(username: string): Promise<void> {
  unwrap(await authClient.updateUser({ username, displayUsername: username }))
}

/** `/change-password` checks the current password; other sessions stay signed in. */
async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  unwrap(await authClient.changePassword({ ...input, revokeOtherSessions: false }))
}

export { changePassword, updateUsername }
