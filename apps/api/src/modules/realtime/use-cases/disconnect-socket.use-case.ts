import { Injectable } from '@nestjs/common'
import { ServersRepository } from '../../servers/repositories/servers.repository'
import { RealtimeEmitter } from '../providers/realtime-emitter'
import { PresenceStore } from '../stores/presence.store'

type Input = { userId: string; socketId: string }

// When the user's last tab closes, the servers they belong to see them go
// offline right away (no grace period; the 30 s one is for voice rooms).
@Injectable()
export class DisconnectSocketUseCase {
  constructor(
    private readonly presence: PresenceStore,
    private readonly servers: ServersRepository,
    private readonly emitter: RealtimeEmitter,
  ) {}

  async execute({ userId, socketId }: Input): Promise<void> {
    const wentOffline = await this.presence.remove(userId, socketId)
    if (!wentOffline) return
    const memberships = await this.servers.listForUser(userId)
    this.emitter.presenceUpdate(
      memberships.map(({ server }) => server.id),
      { userId, online: false },
    )
  }
}
