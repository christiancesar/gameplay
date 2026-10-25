import type { Room, RoomOccupancy, ServerMember } from '@gameplay/contracts'

import type { SidebarRoom } from '@/modules/servers/views/server-sidebar.view'

import { memberName } from './presence-members.mapper'

/**
 * Rooms by position with who is inside. `speaking` holds the ids of who is talking now.
 * Participants who are not in the member list (still loading, or just removed) are left out.
 */
function toSidebarRooms(
  rooms: readonly Room[],
  occupancy: readonly RoomOccupancy[],
  members: readonly ServerMember[],
  speaking: Readonly<Record<string, boolean>> = {},
): SidebarRoom[] {
  const byId = new Map(members.map((member) => [member.user.id, member]))
  const occupancyByRoom = new Map(occupancy.map((entry) => [entry.roomId, entry.participants]))

  return [...rooms]
    .sort((a, b) => a.position - b.position)
    .map((room) => ({
      id: room.id,
      name: room.name,
      participants: (occupancyByRoom.get(room.id) ?? []).flatMap((participant) => {
        const member = byId.get(participant.userId)
        if (!member) return []
        return [
          {
            id: member.user.id,
            name: memberName(member),
            avatarUrl: member.user.image ?? undefined,
            isMuted: participant.muted,
            isDeafened: participant.deafened,
            isSpeaking: speaking[member.user.id] === true,
            isLive: participant.streaming !== null,
          },
        ]
      }),
    }))
}

export { toSidebarRooms }
