import type { Room, RoomOccupancy } from '@gameplay/contracts'

import type { RoomItem } from '@/modules/servers/views/settings/rooms-section.view'

/** Rooms by position with how many people are inside right now. */
function toRoomItems(rooms: readonly Room[], occupancy: readonly RoomOccupancy[]): RoomItem[] {
  const counts = new Map(occupancy.map((entry) => [entry.roomId, entry.participants.length]))
  return [...rooms]
    .sort((a, b) => a.position - b.position)
    .map((room) => ({ id: room.id, name: room.name, occupants: counts.get(room.id) ?? 0 }))
}

export { toRoomItems }
