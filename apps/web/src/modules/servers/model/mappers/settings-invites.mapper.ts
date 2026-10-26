import type { ServerInvite } from '@gameplay/contracts'

import { inviteLink } from '@/modules/servers/model/rules/invite-link'
import type { ServerInviteItem } from '@/modules/servers/model/entities/server-invite-item'

function toStatus(invite: ServerInvite, now: number): ServerInviteItem['status'] {
  switch (invite.status) {
    case 'used':
      return {
        type: 'used',
        user: { name: invite.usedBy?.username ?? '' },
        usedAt: invite.usedAt ?? invite.createdAt,
      }
    case 'revoked':
      return { type: 'revoked' }
    case 'expired':
      return { type: 'expired' }
    // The API status is a snapshot: an invite can run out while the list stays open.
    case 'active':
      return Date.parse(invite.expiresAt) <= now ? { type: 'expired' } : { type: 'active' }
  }
}

/** Invites newest first in the View shape, with the shareable link. */
function toInviteItems(invites: readonly ServerInvite[], origin: string, now: number): ServerInviteItem[] {
  return [...invites]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((invite) => ({
      code: invite.code,
      link: inviteLink(origin, invite.code),
      createdBy: { name: invite.createdBy.username },
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      status: toStatus(invite, now),
    }))
}

export { toInviteItems }
