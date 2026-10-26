import { Injectable, Logger } from '@nestjs/common'
import { ServersRepository } from '../../servers/repositories/servers.repository'
import { RealtimeEmitter } from '../providers/realtime-emitter'
import { Timers } from '../providers/timers'
import { VoiceRoomsConfig, VoiceRoomsService } from '../services/voice-rooms.service'
import { PresenceStore } from '../stores/presence.store'
import { RoomStateStore } from '../stores/room-state.store'

type Input = { userId: string; socketId: string }

// When the user's last tab closes, the servers they belong to see them go
// offline right away. A voice seat held by the socket waits for a
// reconnection (30 s by default) before the person leaves the room, so a
// network blip does not make them blink out.
@Injectable()
export class DisconnectSocketUseCase {
  private readonly logger = new Logger(DisconnectSocketUseCase.name)

  constructor(
    private readonly presence: PresenceStore,
    private readonly servers: ServersRepository,
    private readonly emitter: RealtimeEmitter,
    private readonly store: RoomStateStore,
    private readonly voice: VoiceRoomsService,
    private readonly timers: Timers,
    private readonly config: VoiceRoomsConfig,
  ) {}

  async execute({ userId, socketId }: Input): Promise<void> {
    if (await this.store.detach(userId, socketId)) {
      this.timers.schedule(userId, this.config.reconnectGraceMs, () => this.expireSeat(userId))
    }

    const wentOffline = await this.presence.remove(userId, socketId)
    if (!wentOffline) return
    const memberships = await this.servers.listForUser(userId)
    this.emitter.presenceUpdate(
      memberships.map(({ server }) => server.id),
      { userId, online: false },
    )
  }

  // Still detached: no tab came back for the seat.
  private async expireSeat(userId: string): Promise<void> {
    const seat = await this.store.remove(userId, null)
    if (!seat) return
    this.logger.log({ userId, roomId: seat.roomId }, 'Voice seat expired without a reconnection')
    this.voice.released(seat, null)
    await this.voice.announce(seat.serverId, seat.roomId)
  }
}
