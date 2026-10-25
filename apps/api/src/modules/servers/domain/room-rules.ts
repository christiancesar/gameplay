import { RoomNameTakenError, RoomNotFoundError } from '../errors/servers.errors'
import { type RoomRecord, sameRoomName } from './server'

export function assertRoomNameFree(rooms: RoomRecord[], name: string, exceptRoomId?: string) {
  if (rooms.some((room) => room.id !== exceptRoomId && sameRoomName(room.name, name))) {
    throw new RoomNameTakenError()
  }
}

export function assertRoomExists(rooms: RoomRecord[], roomId: string) {
  if (!rooms.some((room) => room.id === roomId)) throw new RoomNotFoundError()
}
