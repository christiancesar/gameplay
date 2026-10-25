import { Injectable } from '@nestjs/common'
import type { RoomLeft } from '@gameplay/contracts'
import { type Seat, toParticipant } from '../domain/seat'
import { NotInRoomError } from '../errors/realtime.errors'
import { RealtimeEmitter } from '../providers/realtime-emitter'
import { Timers } from '../providers/timers'
import { RoomStateStore } from '../stores/room-state.store'

// Settings of the voice rooms, from the env.
export class VoiceRoomsConfig {
  constructor(readonly reconnectGraceMs: number) {}
}

// Shared by the voice use-cases: who holds a seat, announcing a room and
// taking someone out of it.
@Injectable()
export class VoiceRoomsService {
  constructor(
    private readonly store: RoomStateStore,
    private readonly emitter: RealtimeEmitter,
    private readonly timers: Timers,
  ) {}

  // The seat held by this socket; other tabs of the person cannot act on it.
  async seatOf(userId: string, socketId: string): Promise<Seat> {
    const seat = await this.store.find(userId)
    if (!seat || seat.socketId !== socketId) throw new NotInRoomError()
    return seat
  }

  async announce(serverId: string, roomId: string): Promise<void> {
    const seats = await this.store.listRoom(roomId)
    this.emitter.roomParticipants(serverId, roomId, seats.map(toParticipant))
  }

  // The seat must already be out of the store. Cancels a pending
  // reconnection wait; the socket hears why when reason is set.
  released(seat: Seat, reason: RoomLeft['reason'] | null): void {
    this.timers.cancel(seat.userId)
    if (seat.socketId) this.emitter.seatReleased(seat.socketId, seat.roomId, reason)
  }
}
