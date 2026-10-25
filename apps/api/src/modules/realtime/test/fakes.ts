import type { ServerRemoved } from '@gameplay/shared'
import { makeServersContext } from '../../servers/test/fakes'
import { DomainEventsListener } from '../listeners/domain-events.listener'
import { RealtimeEmitter } from '../providers/realtime-emitter'
import { InMemoryPresenceStore } from '../stores/in-memory/in-memory-presence.store'
import { ConnectSocketUseCase } from '../use-cases/connect-socket.use-case'
import { DisconnectSocketUseCase } from '../use-cases/disconnect-socket.use-case'
import { SubscribeToServerUseCase } from '../use-cases/subscribe-to-server.use-case'

type Emitted =
  | { event: 'presence:update'; serverIds: string[]; userId: string; online: boolean }
  | { event: 'server:changed'; serverId: string }
  | { event: 'server:removed'; userIds: string[]; removal: ServerRemoved }
  | { event: 'session:revoked'; userId: string }

// Keeps what would go to the sockets, in order.
export class FakeRealtimeEmitter extends RealtimeEmitter {
  readonly emitted: Emitted[] = []

  presenceUpdate(serverIds: string[], { userId, online }: { userId: string; online: boolean }) {
    this.emitted.push({ event: 'presence:update', serverIds, userId, online })
  }

  serverChanged(serverId: string) {
    this.emitted.push({ event: 'server:changed', serverId })
  }

  serverRemoved(userIds: string[], removal: ServerRemoved) {
    this.emitted.push({ event: 'server:removed', userIds, removal })
  }

  sessionRevoked(userId: string) {
    this.emitted.push({ event: 'session:revoked', userId })
  }
}

// Two servers: "ana" belongs to both, "bia" only to the first.
export function makeRealtimeContext() {
  const { servers, access } = makeServersContext()
  const presence = new InMemoryPresenceStore()
  const emitter = new FakeRealtimeEmitter()
  servers.servers.set('s1', { ...baseServer, id: 's1' })
  servers.servers.set('s2', { ...baseServer, id: 's2' })
  servers.addMember('s1', 'ana', 'owner')
  servers.addMember('s2', 'ana', 'owner')
  servers.addMember('s1', 'bia', 'member')
  return {
    servers,
    presence,
    emitter,
    connect: new ConnectSocketUseCase(presence, servers, emitter),
    disconnect: new DisconnectSocketUseCase(presence, servers, emitter),
    subscribe: new SubscribeToServerUseCase(access, servers, presence),
    listener: new DomainEventsListener(emitter, presence),
  }
}

const baseServer = {
  name: 'Turbex',
  description: null,
  iconKey: null,
  coverKey: null,
  autoApprove: false,
  ownerId: 'ana',
  createdAt: new Date(),
}
