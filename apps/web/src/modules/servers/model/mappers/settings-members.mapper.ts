import type { ServerMember } from '@gameplay/contracts'

import type { MemberItem } from '@/modules/servers/views/settings/members-section.view'

import { memberName } from './presence-members.mapper'

const ROLE_ORDER = { owner: 0, admin: 1, member: 2 } as const

/** Members by role and name. `id` is the user id, which is what the member routes take. */
function toMemberItems(members: readonly ServerMember[], currentUserId: string | undefined): MemberItem[] {
  return members
    .map((member) => ({
      id: member.user.id,
      user: {
        name: memberName(member),
        username: member.user.username,
        avatarUrl: member.user.image ?? undefined,
      },
      role: member.role,
      isMe: member.user.id === currentUserId,
      joinedVia: member.invite ? { invitedBy: member.invite.createdBy.username, joinedAt: member.joinedAt } : undefined,
    }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.user.name.localeCompare(b.user.name))
}

export { toMemberItems }
