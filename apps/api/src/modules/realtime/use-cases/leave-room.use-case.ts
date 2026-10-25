import { Injectable } from '@nestjs/common'
import { VoiceRoomsService } from '../services/voice-rooms.service'
import { RoomStateStore } from '../stores/room-state.store'

type Input = { userId: string; socketId: string }

// Only the tab holding the seat leaves; from another tab nothing happens.
@Injectable()
export class LeaveRoomUseCase {
  constructor(
    private readonly store: RoomStateStore,
    private readonly voice: VoiceRoomsService,
  ) {}

  async execute({ userId, socketId }: Input): Promise<void> {
    const seat = await this.store.remove(userId, socketId)
    if (!seat) return
    this.voice.released(seat, null)
    await this.voice.announce(seat.serverId, seat.roomId)
  }
}
