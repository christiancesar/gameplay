import type { RoomRecord } from '../domain/server'

// `guard` runs inside the transaction with the server's row locked and the
// server's current rooms; throwing aborts the write.
export type RoomsGuard = (rooms: RoomRecord[]) => void

export abstract class RoomsRepository {
  // By position.
  abstract list(serverId: string): Promise<RoomRecord[]>
  // Appended after the last room.
  abstract create(serverId: string, name: string, guard: RoomsGuard): Promise<RoomRecord>
  abstract rename(serverId: string, roomId: string, name: string, guard: RoomsGuard): Promise<RoomRecord>
  abstract delete(serverId: string, roomId: string): Promise<void>
  // roomIds holds every room of the server, in the new order.
  abstract reorder(serverId: string, roomIds: string[], guard: RoomsGuard): Promise<RoomRecord[]>
}
