import { Injectable, Logger } from '@nestjs/common'
import type { RoomJoinResult } from '@gameplay/contracts'
import { RoomNotFoundError, ServerNotFoundError } from '../../servers/errors/servers.errors'
import { RoomsRepository } from '../../servers/repositories/rooms.repository'
import { ServerAccessService } from '../../servers/services/server-access.service'
import { displacedSocket, seatAfterJoin, toParticipant } from '../domain/seat'
import { RealtimeEmitter } from '../providers/realtime-emitter/realtime-emitter.provider'
import { Timers } from '../providers/timers/timers.provider'
import { VoiceRoomsService } from '../services/voice-rooms.service'
import { RoomStateStore } from '../stores/room-state.store'

type Input = { userId: string; socketId: string; roomId: string; muted: boolean; deafened: boolean }

// One room per person, across tabs: joining leaves the previous room, and a
// tab that held the seat is told. Rejoining the same room after a dropped
// connection keeps the seat and the screen share.
@Injectable()
export class JoinRoomUseCase {
  private readonly logger = new Logger(JoinRoomUseCase.name)

  constructor(
    private readonly rooms: RoomsRepository,
    private readonly access: ServerAccessService,
    private readonly store: RoomStateStore,
    private readonly voice: VoiceRoomsService,
    private readonly emitter: RealtimeEmitter,
    private readonly timers: Timers,
  ) {}

  async execute({ userId, socketId, roomId, muted, deafened }: Input): Promise<RoomJoinResult> {
    // Not a member answers as a missing room, so ids don't leak.
    const room = await this.rooms.findById(roomId)
    if (!room) throw new RoomNotFoundError()
    await this.access.member(room.serverId, userId).catch((error: unknown) => {
      throw error instanceof ServerNotFoundError ? new RoomNotFoundError() : error
    })

    const input = { userId, socketId, serverId: room.serverId, roomId, muted, deafened }
    const { previous } = await this.store.join(userId, (current) => seatAfterJoin(current, input))
    this.timers.cancel(userId)

    const displaced = displacedSocket(previous, socketId)
    if (previous?.socketId && (displaced || previous.roomId !== roomId)) {
      this.emitter.seatReleased(previous.socketId, previous.roomId, displaced ? 'other-tab' : null)
    }
    if (previous && previous.roomId !== roomId) {
      await this.voice.leftRoom(userId, previous.roomId)
      await this.voice.announce(previous.serverId, previous.roomId)
    }

    this.logger.log(
      { userId, serverId: room.serverId, roomId, rejoined: previous?.roomId === roomId },
      'Joined voice room',
    )
    this.emitter.seatTaken(socketId, roomId)
    await this.voice.announce(room.serverId, roomId)
    const seats = await this.store.listRoom(roomId)
    return { participants: seats.map(toParticipant) }
  }
}
