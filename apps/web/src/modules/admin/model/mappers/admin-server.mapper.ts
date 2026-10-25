import type { AdminServer, ServerMember } from '@gameplay/contracts'

import type { AdminServerMember } from '@/modules/admin/views/server-members-dialog.view'
import type { AdminServerItem } from '@/modules/admin/views/servers-tab.view'

import { displayName } from './admin-user.mapper'

type ServerLimitOverride = { maxMembers?: number; maxRooms?: number }

type AdminServerContext = {
  defaultMembersLimit: number
  defaultRoomsLimit: number
  /** Override set from this panel, when known (the API does not return it). */
  override?: ServerLimitOverride
}

function toAdminServerItem(server: AdminServer, context: AdminServerContext): AdminServerItem {
  const { maxMembers, maxRooms } = context.override ?? {}
  return {
    id: server.id,
    name: server.name,
    iconUrl: server.iconUrl ?? undefined,
    ownerName: server.owner.username,
    members: {
      count: server.memberCount,
      limit: maxMembers ?? context.defaultMembersLimit,
      isOverride: maxMembers !== undefined,
    },
    rooms: {
      count: server.roomCount,
      limit: maxRooms ?? context.defaultRoomsLimit,
      isOverride: maxRooms !== undefined,
    },
  }
}

/** The owner has no invite; everyone else shows who created the invite they used. */
function toAdminServerMember(member: ServerMember): AdminServerMember {
  return {
    id: member.user.id,
    user: {
      name: displayName(member.user),
      username: member.user.username,
      avatarUrl: member.user.image ?? undefined,
    },
    role: member.role,
    joinedVia: member.invite ? { invitedBy: member.invite.createdBy.username, joinedAt: member.joinedAt } : undefined,
  }
}

export { toAdminServerItem, toAdminServerMember }
export type { AdminServerContext, ServerLimitOverride }
