import { Injectable } from '@nestjs/common'
import type { StreamPreset } from '@gameplay/shared'
import { NotInRoomError } from '../errors/realtime.errors'
import { VoiceRoomsService } from '../services/voice-rooms.service'
import { RoomStateStore, type SeatChanges } from '../stores/room-state.store'

type Input = { userId: string; socketId: string } & (
  | { muted: boolean; deafened: boolean }
  | { streaming: StreamPreset | null }
)

// Mute and deafen (voice:state) and the screen share (stream:start and
// stream:stop) of the seat this socket holds, announced to the room.
@Injectable()
export class UpdateVoiceStateUseCase {
  constructor(
    private readonly store: RoomStateStore,
    private readonly voice: VoiceRoomsService,
  ) {}

  async execute({ userId, socketId, ...changes }: Input): Promise<void> {
    const seat = await this.store.update(userId, socketId, changes satisfies SeatChanges)
    if (!seat) throw new NotInRoomError()
    await this.voice.announce(seat.serverId, seat.roomId)
  }
}
