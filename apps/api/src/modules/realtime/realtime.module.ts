import { Module } from '@nestjs/common'
import { metrics } from '@opentelemetry/api'
import { EnvService } from '../../env/env.service'
import { ServersModule } from '../servers/servers.module'
import { RealtimeGateway } from './gateways/realtime.gateway'
import { DomainEventsListener } from './listeners/domain-events.listener'
import { RealtimeMetricsInterceptor } from './interceptors/realtime-metrics.interceptor'
import { RealtimeEmitter, SocketIoRealtimeEmitter } from './providers/realtime-emitter'
import { OtelRealtimeMetrics, RealtimeMetrics } from './providers/realtime-metrics'
import { BetterAuthSocketSessionResolver, SocketSessionResolver } from './providers/socket-session-resolver'
import { NodeTimers, Timers } from './providers/timers'
import { VoiceRoomsConfig, VoiceRoomsService } from './services/voice-rooms.service'
import { InMemoryPresenceStore } from './stores/in-memory/in-memory-presence.store'
import { InMemoryRoomStateStore } from './stores/in-memory/in-memory-room-state.store'
import { PresenceStore } from './stores/presence.store'
import { RoomStateStore } from './stores/room-state.store'
import { InMemorySfuSessionStore } from './stores/in-memory/in-memory-sfu-session.store'
import { SfuSessionStore } from './stores/sfu-session.store'
import { ConnectSocketUseCase } from './use-cases/connect-socket.use-case'
import { DisconnectSocketUseCase } from './use-cases/disconnect-socket.use-case'
import { JoinRoomUseCase } from './use-cases/join-room.use-case'
import { LeaveRoomUseCase } from './use-cases/leave-room.use-case'
import { RelayToPeerUseCase } from './use-cases/relay-to-peer.use-case'
import { ReleaseVoiceSeatsUseCase } from './use-cases/release-voice-seats.use-case'
import { SubscribeToServerUseCase } from './use-cases/subscribe-to-server.use-case'
import { UpdateVoiceStateUseCase } from './use-cases/update-voice-state.use-case'

// Socket.IO gateway: authenticated connection, presence, voice rooms with
// WebRTC signaling, and the bridge from domain events to the sockets. Voice
// state lives in memory only; nothing here writes to the database.
// PresenceStore is exported for the platform admin panel (BE-15); RoomStateStore
// and SfuSessionStore for the media module (SFU sessions of people in rooms).
@Module({
  imports: [ServersModule],
  providers: [
    RealtimeGateway,
    DomainEventsListener,
    SocketIoRealtimeEmitter,
    { provide: RealtimeEmitter, useExisting: SocketIoRealtimeEmitter },
    { provide: SocketSessionResolver, useClass: BetterAuthSocketSessionResolver },
    { provide: PresenceStore, useClass: InMemoryPresenceStore },
    { provide: RoomStateStore, useClass: InMemoryRoomStateStore },
    { provide: SfuSessionStore, useClass: InMemorySfuSessionStore },
    { provide: Timers, useClass: NodeTimers },
    {
      provide: RealtimeMetrics,
      inject: [PresenceStore, RoomStateStore],
      useFactory: (presence: PresenceStore, rooms: RoomStateStore) =>
        new OtelRealtimeMetrics(metrics.getMeter('gameplay-realtime'), presence, rooms),
    },
    RealtimeMetricsInterceptor,
    {
      provide: VoiceRoomsConfig,
      inject: [EnvService],
      useFactory: (env: EnvService) => new VoiceRoomsConfig(env.get('ROOM_RECONNECT_GRACE_MS')),
    },
    VoiceRoomsService,
    ConnectSocketUseCase,
    DisconnectSocketUseCase,
    SubscribeToServerUseCase,
    JoinRoomUseCase,
    LeaveRoomUseCase,
    UpdateVoiceStateUseCase,
    RelayToPeerUseCase,
    ReleaseVoiceSeatsUseCase,
  ],
  exports: [PresenceStore, RoomStateStore, SfuSessionStore],
})
export class RealtimeModule {}
