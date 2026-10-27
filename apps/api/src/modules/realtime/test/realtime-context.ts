import { FakeEventBus } from '../../../common/test/fake-event-bus'
import { makeServersContext } from '../../servers/test/servers-context'
import { DomainEventsListener } from '../listeners/domain-events.listener'
import { VoiceRoomsConfig, VoiceRoomsService } from '../services/voice-rooms.service'
import { InMemoryPresenceStore } from '../stores/in-memory/in-memory-presence.store'
import { InMemoryRoomStateStore } from '../stores/in-memory/in-memory-room-state.store'
import { InMemorySfuSessionStore } from '../stores/in-memory/in-memory-sfu-session.store'
import { ConnectSocketUseCase } from '../use-cases/connect-socket.use-case'
import { DisconnectSocketUseCase } from '../use-cases/disconnect-socket.use-case'
import { JoinRoomUseCase } from '../use-cases/join-room.use-case'
import { LeaveRoomUseCase } from '../use-cases/leave-room.use-case'
import { RelayToPeerUseCase } from '../use-cases/relay-to-peer.use-case'
import { ReleaseVoiceSeatsUseCase } from '../use-cases/release-voice-seats.use-case'
import { SubscribeToServerUseCase } from '../use-cases/subscribe-to-server.use-case'
import { UpdateVoiceStateUseCase } from '../use-cases/update-voice-state.use-case'
import { FakeRealtimeEmitter } from './fake-realtime-emitter'
import { FakeTimers } from './fake-timers'
import { SEED_MEMBERS, SEED_ROOMS, SEED_SERVERS } from './realtime-seed'

// Every realtime use-case wired to in-memory stores and fakes, over the seed.
export function makeRealtimeContext() {
  const { servers, rooms, access } = makeServersContext()
  for (const server of SEED_SERVERS) servers.servers.set(server.id, { ...server })
  for (const { serverId, userId, role } of SEED_MEMBERS) servers.addMember(serverId, userId, role)
  rooms.rooms.push(...SEED_ROOMS.map((room) => ({ ...room })))

  const presence = new InMemoryPresenceStore()
  const store = new InMemoryRoomStateStore()
  const emitter = new FakeRealtimeEmitter()
  const timers = new FakeTimers()
  const events = new FakeEventBus()
  const sfuSessions = new InMemorySfuSessionStore()
  const voice = new VoiceRoomsService(store, emitter, timers, events)
  const config = new VoiceRoomsConfig(30_000)
  const joinRoom = new JoinRoomUseCase(rooms, access, store, voice, emitter, timers)
  const releaseSeats = new ReleaseVoiceSeatsUseCase(store, voice)

  return {
    servers,
    presence,
    store,
    emitter,
    timers,
    events,
    sfuSessions,
    connect: new ConnectSocketUseCase(presence, servers, emitter),
    disconnect: new DisconnectSocketUseCase(presence, servers, emitter, store, voice, timers, config),
    subscribe: new SubscribeToServerUseCase(access, servers, presence, store),
    joinRoom,
    // Joins with a socket named after the user.
    join: (userId: string, roomId: string, socketId = `${userId}-tab`) =>
      joinRoom.execute({ userId, socketId, roomId, muted: false, deafened: false }),
    leaveRoom: new LeaveRoomUseCase(store, voice),
    updateVoiceState: new UpdateVoiceStateUseCase(store, voice, sfuSessions, events),
    relay: new RelayToPeerUseCase(store, voice, emitter),
    releaseSeats,
    listener: new DomainEventsListener(emitter, presence, releaseSeats),
  }
}
