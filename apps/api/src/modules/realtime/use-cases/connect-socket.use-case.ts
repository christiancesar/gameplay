import { Injectable } from '@nestjs/common'
import { ServersRepository } from '../../servers/repositories/servers.repository'
import { RealtimeEmitter } from '../providers/realtime-emitter/realtime-emitter.provider'
import { PresenceStore } from '../stores/presence.store'

type Input = { userId: string; socketId: string }

// A socket passed the handshake. On the user's first tab, the servers they
// belong to see them go online.
@Injectable()
export class ConnectSocketUseCase {
  constructor(
    private readonly presence: PresenceStore,
    private readonly servers: ServersRepository,
    private readonly emitter: RealtimeEmitter,
  ) {}

  async execute({ userId, socketId }: Input): Promise<void> {
    const wentOnline = await this.presence.add(userId, socketId)
    if (!wentOnline) return
    const memberships = await this.servers.listForUser(userId)
    this.emitter.presenceUpdate(
      memberships.map(({ server }) => server.id),
      { userId, online: true },
    )
  }
}
