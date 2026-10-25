import type { ResolvedInvite } from '@gameplay/contracts'

import type { InviteError } from '@/modules/invites/views/invite-landing.view'
import { ApiError } from '@/shared/lib/api-error'

/** Error shown for an invite that cannot be used, from the status `GET /invites/:code` reports. */
function mapInviteStatus(status: ResolvedInvite['status']): InviteError | undefined {
  switch (status) {
    case 'active':
      return undefined
    case 'expired':
      return 'expired'
    case 'used':
      return 'exhausted'
    // A revoked invite is shown like an unknown one: the page does not tell who revoked it.
    case 'revoked':
    case 'not-found':
      return 'notFound'
  }
}

/** Maps a failed `POST /invites/:code/join` (error codes of `memberships.errors.ts`). */
function mapJoinInviteError(error: unknown): InviteError {
  if (!(error instanceof ApiError)) return 'notFound'
  switch (error.code) {
    case 'SERVER_INVITE_EXPIRED':
      return 'expired'
    case 'SERVER_INVITE_USED':
      return 'exhausted'
    case 'JOIN_REQUEST_PENDING':
      return 'requestPending'
    default:
      // SERVER_INVITE_REVOKED, SERVER_INVITE_NOT_FOUND and anything unexpected.
      return 'notFound'
  }
}

export { mapInviteStatus, mapJoinInviteError }
