import type { JoinRequest } from '@gameplay/contracts'

import type { JoinRequestItem } from '@/modules/servers/model/entities/join-request-item'

/** Oldest request first, so the queue is answered in order. */
function toJoinRequestItems(requests: readonly JoinRequest[]): JoinRequestItem[] {
  return [...requests]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((request) => ({
      id: request.id,
      user: {
        name: request.user.displayUsername ?? request.user.username,
        username: request.user.username,
        avatarUrl: request.user.image ?? undefined,
      },
      requestedAt: request.createdAt,
      invitedBy: request.invitedBy.username,
    }))
}

export { toJoinRequestItems }
