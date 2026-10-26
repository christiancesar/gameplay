import { Injectable } from '@nestjs/common'
import type { Seat } from '../../domain/seat'
import { RoomStateStore, type SeatChanges } from '../room-state.store'

@Injectable()
export class InMemoryRoomStateStore extends RoomStateStore {
  // Insertion order is the join order.
  private readonly seats = new Map<string, Seat>()

  async find(userId: string): Promise<Seat | null> {
    return copy(this.seats.get(userId))
  }

  async join(userId: string, build: (previous: Seat | null) => Seat) {
    const previous = copy(this.seats.get(userId))
    const seat = build(previous)
    if (previous && previous.roomId !== seat.roomId) this.seats.delete(userId)
    this.seats.set(userId, { ...seat })
    return { previous, seat }
  }

  async update(userId: string, socketId: string, changes: SeatChanges): Promise<Seat | null> {
    const seat = this.seats.get(userId)
    if (!seat || seat.socketId !== socketId) return null
    Object.assign(seat, changes)
    return copy(seat)
  }

  async detach(userId: string, socketId: string): Promise<Seat | null> {
    const seat = this.seats.get(userId)
    if (!seat || seat.socketId !== socketId) return null
    seat.socketId = null
    return copy(seat)
  }

  async remove(userId: string, holder?: string | null): Promise<Seat | null> {
    const seat = this.seats.get(userId)
    if (!seat || (holder !== undefined && seat.socketId !== holder)) return null
    this.seats.delete(userId)
    return copy(seat)
  }

  async listRoom(roomId: string): Promise<Seat[]> {
    return [...this.seats.values()].filter((seat) => seat.roomId === roomId).map((seat) => ({ ...seat }))
  }

  async listServer(serverId: string): Promise<Seat[]> {
    return [...this.seats.values()].filter((seat) => seat.serverId === serverId).map((seat) => ({ ...seat }))
  }

  async stats(): Promise<{ seats: number; streaming: number }> {
    let streaming = 0
    for (const seat of this.seats.values()) if (seat.streaming) streaming += 1
    return { seats: this.seats.size, streaming }
  }
}

function copy(seat: Seat | undefined): Seat | null {
  return seat ? { ...seat } : null
}
