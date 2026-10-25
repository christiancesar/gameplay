import { Module } from '@nestjs/common'
import { ServersModule } from '../servers/servers.module'
import { RealtimeGateway } from './gateways/realtime.gateway'
import { DomainEventsListener } from './listeners/domain-events.listener'
import { RealtimeEmitter, SocketIoRealtimeEmitter } from './providers/realtime-emitter'
import { BetterAuthSocketSessionResolver, SocketSessionResolver } from './providers/socket-session-resolver'
import { InMemoryPresenceStore } from './stores/in-memory/in-memory-presence.store'
import { PresenceStore } from './stores/presence.store'
import { ConnectSocketUseCase } from './use-cases/connect-socket.use-case'
import { DisconnectSocketUseCase } from './use-cases/disconnect-socket.use-case'
import { SubscribeToServerUseCase } from './use-cases/subscribe-to-server.use-case'

// Socket.IO gateway: authenticated connection, presence and the bridge from
// domain events to the sockets. Nothing here touches the database directly.
// PresenceStore is exported for the platform admin panel (BE-15).
@Module({
  imports: [ServersModule],
  providers: [
    RealtimeGateway,
    DomainEventsListener,
    SocketIoRealtimeEmitter,
    { provide: RealtimeEmitter, useExisting: SocketIoRealtimeEmitter },
    { provide: SocketSessionResolver, useClass: BetterAuthSocketSessionResolver },
    { provide: PresenceStore, useClass: InMemoryPresenceStore },
    ConnectSocketUseCase,
    DisconnectSocketUseCase,
    SubscribeToServerUseCase,
  ],
  exports: [PresenceStore],
})
export class RealtimeModule {}
