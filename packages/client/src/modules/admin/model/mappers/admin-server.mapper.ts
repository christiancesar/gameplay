import type { AdminServer, ServerMember } from '@gameplay/contracts'

import type { AdminServerMember } from '@/modules/admin/model/entities/admin-server-member'
import type { AdminServerItem } from '@/modules/admin/model/entities/admin-server-item'

import { displayName } from './admin-user.mapper'

function toAdminServerItem(server: AdminServer): AdminServerItem {
  return {
    id: server.id,
    name: server.name,
    iconUrl: server.iconUrl ?? undefined,
    ownerName: server.owner.username,
    members: {
      count: server.memberCount,
      limit: server.effectiveMaxMembers,
      isOverride: server.maxMembersOverride !== null,
    },
    rooms: {
      count: server.roomCount,
      limit: server.effectiveMaxRooms,
      isOverride: server.maxRoomsOverride !== null,
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
