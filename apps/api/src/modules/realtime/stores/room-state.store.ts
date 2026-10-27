import type { Seat } from '../domain/seat'

export type SeatChanges = Partial<Pick<Seat, 'muted' | 'deafened' | 'streaming' | 'streamMode'>>

// Who is in which voice room, one seat per person. In memory for the single
// MVP instance; async so Redis can replace it. Every method is atomic.
export abstract class RoomStateStore {
  abstract find(userId: string): Promise<Seat | null>
  // Replaces the person's seat with build(previous). A seat in another room
  // moves to the end of the new room; in the same room it keeps its place.
  abstract join(userId: string, build: (previous: Seat | null) => Seat): Promise<{ previous: Seat | null; seat: Seat }>
  // Only while held by that socket; null otherwise.
  abstract update(userId: string, socketId: string, changes: SeatChanges): Promise<Seat | null>
  // The socket is gone: the seat waits for a reconnection (socketId null).
  abstract detach(userId: string, socketId: string): Promise<Seat | null>
  // Removes the seat when held by `holder` (a socket id, or null for a
  // detached seat); with no holder, whatever holds it.
  abstract remove(userId: string, holder?: string | null): Promise<Seat | null>
  // In join order.
  abstract listRoom(roomId: string): Promise<Seat[]>
  abstract listServer(serverId: string): Promise<Seat[]>
  abstract listAll(): Promise<Seat[]>
  // Totals for the metrics: seats in every room, and how many of them share a screen.
  abstract stats(): Promise<{ seats: number; streaming: number }>
}
