import { Injectable, Logger } from '@nestjs/common'
import type { StreamMode, StreamPreset } from '@gameplay/contracts'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { NotInRoomError, ScreenNotPublishedError } from '../errors/realtime.errors'
import { VoiceRoomsService } from '../services/voice-rooms.service'
import { RoomStateStore, type SeatChanges } from '../stores/room-state.store'
import { SfuSessionStore } from '../stores/sfu-session.store'

type Input = { userId: string; socketId: string } & (
  | { muted: boolean; deafened: boolean }
  | { streaming: StreamPreset; streamMode: StreamMode }
  | { streaming: null }
)

// Mute and deafen (voice:state) and the screen share (stream:start and
// stream:stop) of the seat this socket holds, announced to the room.
@Injectable()
export class UpdateVoiceStateUseCase {
  private readonly logger = new Logger(UpdateVoiceStateUseCase.name)

  constructor(
    private readonly store: RoomStateStore,
    private readonly voice: VoiceRoomsService,
    private readonly sfuSessions: SfuSessionStore,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ userId, socketId, ...input }: Input): Promise<void> {
    const changes: SeatChanges = 'streaming' in input ? streamChanges(input) : input
    if (changes.streamMode === 'sfu') await this.requirePublishedScreen(userId, socketId)

    const seat = await this.store.update(userId, socketId, changes)
    if (!seat) throw new NotInRoomError()
    if ('streaming' in changes) {
      const { serverId, roomId, streaming, streamMode } = seat
      this.logger.log(
        { userId, serverId, roomId, preset: streaming, mode: streamMode },
        streaming ? 'Screen share started' : 'Screen share stopped',
      )
      await this.events.publish('stream.changed', {
        userId,
        roomId,
        mode: streamMode,
      })
    }
    await this.voice.announce(seat.serverId, seat.roomId)
  }

  // The screen was published to the SFU from the room the seat is in.
  private async requirePublishedScreen(userId: string, socketId: string): Promise<void> {
    const seat = await this.voice.seatOf(userId, socketId)
    const publication = await this.sfuSessions.publicationOf(userId)
    const hasVideo = publication?.published.some((track) => track.kind === 'video')
    if (publication?.roomId !== seat.roomId || !hasVideo) throw new ScreenNotPublishedError()
  }
}

function streamChanges(input: { streaming: StreamPreset; streamMode: StreamMode } | { streaming: null }): SeatChanges {
  return input.streaming ? input : { streaming: null, streamMode: null }
}
