import { Injectable, Logger } from '@nestjs/common'
import type { RoomLeft } from '@gameplay/contracts'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { type Seat, toParticipant } from '../domain/seat'
import { NotInRoomError } from '../errors/realtime.errors'
import { RealtimeEmitter } from '../providers/realtime-emitter/realtime-emitter.provider'
import { Timers } from '../providers/timers/timers.provider'
import { RoomStateStore } from '../stores/room-state.store'

// Settings of the voice rooms, from the env.
export class VoiceRoomsConfig {
  constructor(readonly reconnectGraceMs: number) {}
}

// Shared by the voice use-cases: who holds a seat, announcing a room and
// taking someone out of it.
@Injectable()
export class VoiceRoomsService {
  private readonly logger = new Logger(VoiceRoomsService.name)

  constructor(
    private readonly store: RoomStateStore,
    private readonly emitter: RealtimeEmitter,
    private readonly timers: Timers,
    private readonly events: DomainEventBus,
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
  async released(seat: Seat, reason: RoomLeft['reason'] | null): Promise<void> {
    const { userId, serverId, roomId } = seat
    this.logger.log({ userId, serverId, roomId, reason: reason ?? 'left' }, 'Left voice room')
    this.timers.cancel(seat.userId)
    if (seat.socketId) this.emitter.seatReleased(seat.socketId, seat.roomId, reason)
    await this.leftRoom(userId, roomId)
  }

  // The person is no longer in this room (also when moving to another one).
  async leftRoom(userId: string, roomId: string): Promise<void> {
    await this.events.publish('voice.left-room', { userId, roomId })
  }
}
