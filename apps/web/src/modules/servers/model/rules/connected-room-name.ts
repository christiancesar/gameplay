import type { Room } from '@gameplay/contracts'

import type { VoiceConnection } from '@/modules/rooms/model/entities/voice-state'

/** Name of the room the user is connected to, looked up in the rooms of that server. Empty when unknown. */
function connectedRoomName(connection: VoiceConnection | null, rooms: readonly Room[] | undefined): string {
  if (!connection || !rooms) return ''
  return rooms.find((room) => room.id === connection.roomId)?.name ?? ''
}

export { connectedRoomName }
