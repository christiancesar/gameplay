import type { RoomRecord } from '../../domain/server'
import { RoomsRepository, type RoomsGuard } from '../rooms.repository'

export class InMemoryRoomsRepository extends RoomsRepository {
  rooms: RoomRecord[] = []
  private sequence = 0

  insert(serverId: string, name: string): RoomRecord {
    this.sequence += 1
    const position = Math.max(-1, ...this.byServer(serverId).map((room) => room.position)) + 1
    const room = { id: `room-${this.sequence}`, serverId, name, position }
    this.rooms.push(room)
    return { ...room }
  }

  removeServer(serverId: string) {
    this.rooms = this.rooms.filter((room) => room.serverId !== serverId)
  }

  async list(serverId: string): Promise<RoomRecord[]> {
    return this.byServer(serverId)
  }

  async create(serverId: string, name: string, guard: RoomsGuard): Promise<RoomRecord> {
    guard(this.byServer(serverId))
    return this.insert(serverId, name)
  }

  async rename(serverId: string, roomId: string, name: string, guard: RoomsGuard): Promise<RoomRecord> {
    guard(this.byServer(serverId))
    const room = this.rooms.find((r) => r.id === roomId && r.serverId === serverId)!
    room.name = name
    return { ...room }
  }

  async delete(serverId: string, roomId: string): Promise<void> {
    this.rooms = this.rooms.filter((room) => !(room.id === roomId && room.serverId === serverId))
  }

  async reorder(serverId: string, roomIds: string[], guard: RoomsGuard): Promise<RoomRecord[]> {
    guard(this.byServer(serverId))
    for (const room of this.rooms) {
      if (room.serverId === serverId) room.position = roomIds.indexOf(room.id)
    }
    return this.byServer(serverId)
  }

  private byServer(serverId: string): RoomRecord[] {
    return this.rooms
      .filter((room) => room.serverId === serverId)
      .sort((a, b) => a.position - b.position)
      .map((room) => ({ ...room }))
  }
}
