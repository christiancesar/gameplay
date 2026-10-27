import { Injectable } from '@nestjs/common'
import type { ReceivedQuality } from '@gameplay/contracts'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { NotStreamingError, PeerNotInRoomError } from '../errors/realtime.errors'
import { RealtimeEmitter } from '../providers/realtime-emitter/realtime-emitter.provider'
import { RoomStateStore } from '../stores/room-state.store'
import { VoiceRoomsService } from '../services/voice-rooms.service'

type Input = { userId: string; socketId: string; streamerId: string; bytes: number; quality: ReceivedQuality | null }

// A viewer watching through the SFU tells what they received: the bytes
// count against the monthly budget, the quality goes to the streamer.
@Injectable()
export class ReportMediaUsageUseCase {
  constructor(
    private readonly store: RoomStateStore,
    private readonly voice: VoiceRoomsService,
    private readonly emitter: RealtimeEmitter,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ userId, socketId, streamerId, bytes, quality }: Input): Promise<void> {
    const seat = await this.voice.seatOf(userId, socketId)
    const streamer = streamerId === userId ? null : await this.store.find(streamerId)
    if (!streamer || streamer.roomId !== seat.roomId) throw new PeerNotInRoomError()
    // Only the SFU costs; a Direct share reports nothing.
    if (streamer.streamMode !== 'sfu') throw new NotStreamingError()

    if (quality && streamer.socketId) this.emitter.streamReceived(streamer.socketId, { viewerId: userId, quality })
    if (bytes > 0) await this.events.publish('media.usage-reported', { userId, bytes })
  }
}
