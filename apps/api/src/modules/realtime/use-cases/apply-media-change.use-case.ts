import { Injectable, Logger } from '@nestjs/common'
import type { MediaResource } from '@gameplay/contracts'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { EffectiveMediaService } from '../../limits/services/effective-media.service'
import type { Seat } from '../domain/seat'
import { RealtimeEmitter } from '../providers/realtime-emitter/realtime-emitter.provider'
import { VoiceRoomsService } from '../services/voice-rooms.service'
import { RoomStateStore } from '../stores/room-state.store'

type Input = { serverId: string | null; disabled: MediaResource[]; turnCutUserIds: string[] }

// After the platform admin changes the media resources: screen shares in a
// mode that went off stop right away (the streamer hears why), the people
// who lost the TURN relay redo their connections without it, and everyone
// in scope refetches what the server offers.
@Injectable()
export class ApplyMediaChangeUseCase {
  private readonly logger = new Logger(ApplyMediaChangeUseCase.name)

  constructor(
    private readonly store: RoomStateStore,
    private readonly voice: VoiceRoomsService,
    private readonly emitter: RealtimeEmitter,
    private readonly media: EffectiveMediaService,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, disabled, turnCutUserIds }: Input): Promise<void> {
    const seats = serverId ? await this.store.listServer(serverId) : await this.store.listAll()
    const rooms = new Map<string, string>()
    for (const seat of seats) {
      if (!seat.streamMode || !disabled.includes(seat.streamMode)) continue
      if (await this.media.isOn(seat.serverId, seat.streamMode)) continue
      if (await this.stop(seat)) rooms.set(seat.roomId, seat.serverId)
    }
    for (const [roomId, roomServerId] of rooms) await this.voice.announce(roomServerId, roomId)

    this.emitter.mediaChanged(serverId ? { serverId } : 'everyone', { serverId, turnOff: false })
    this.emitter.mediaChanged({ userIds: turnCutUserIds }, { serverId, turnOff: true })
  }

  private async stop(seat: Seat): Promise<boolean> {
    const { userId, socketId, serverId, roomId, streamMode } = seat
    const stopped = socketId ? await this.store.update(userId, socketId, { streaming: null, streamMode: null }) : null
    if (!stopped || !socketId) return false
    this.logger.log({ userId, serverId, roomId, mode: streamMode }, 'Screen share stopped: mode turned off')
    this.emitter.streamEnded(socketId, { reason: 'disabled' })
    await this.events.publish('stream.changed', { userId, roomId, mode: null })
    return true
  }
}
