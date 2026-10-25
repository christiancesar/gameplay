import type { ServerMember } from '@gameplay/contracts'

import type { PresenceMember } from '@/modules/servers/views/members-presence.view'

const ROLE_ORDER = { owner: 0, admin: 1, member: 2 } as const

function memberName(member: ServerMember): string {
  return member.user.displayUsername ?? member.user.username
}

/** Members in the View shape, ordered by role and then by name. */
function toPresenceMembers(members: readonly ServerMember[], onlineUserIds: readonly string[]): PresenceMember[] {
  const online = new Set(onlineUserIds)
  return members
    .map((member) => ({
      id: member.user.id,
      name: memberName(member),
      avatarUrl: member.user.image ?? undefined,
      role: member.role,
      isOnline: online.has(member.user.id),
    }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name))
}

export { memberName, toPresenceMembers }
