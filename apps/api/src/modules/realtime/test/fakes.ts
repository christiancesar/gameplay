import type { Participant, RoomLeft, ServerRemoved, SignalReceive, StreamQualityLevel } from '@gameplay/shared'
import { makeServersContext } from '../../servers/test/fakes'
import { DomainEventsListener } from '../listeners/domain-events.listener'
import { RealtimeEmitter } from '../providers/realtime-emitter'
import { Timers } from '../providers/timers'
import { VoiceRoomsConfig, VoiceRoomsService } from '../services/voice-rooms.service'
import { InMemoryPresenceStore } from '../stores/in-memory/in-memory-presence.store'
import { InMemoryRoomStateStore } from '../stores/in-memory/in-memory-room-state.store'
import { ConnectSocketUseCase } from '../use-cases/connect-socket.use-case'
import { DisconnectSocketUseCase } from '../use-cases/disconnect-socket.use-case'
import { JoinRoomUseCase } from '../use-cases/join-room.use-case'
import { LeaveRoomUseCase } from '../use-cases/leave-room.use-case'
import { RelayToPeerUseCase } from '../use-cases/relay-to-peer.use-case'
import { ReleaseVoiceSeatsUseCase } from '../use-cases/release-voice-seats.use-case'
import { SubscribeToServerUseCase } from '../use-cases/subscribe-to-server.use-case'
import { UpdateVoiceStateUseCase } from '../use-cases/update-voice-state.use-case'

type Emitted =
  | { event: 'presence:update'; serverIds: string[]; userId: string; online: boolean }
  | { event: 'server:changed'; serverId: string }
  | { event: 'server:removed'; userIds: string[]; removal: ServerRemoved }
  | { event: 'session:revoked'; userId: string }
  | { event: 'room:participants'; serverId: string; roomId: string; participants: Participant[] }
  | { event: 'seat:taken'; socketId: string; roomId: string }
  | { event: 'seat:released'; socketId: string; roomId: string; reason: RoomLeft['reason'] | null }
  | { event: 'stream:watch-request'; socketId: string; viewerId: string }
  | { event: 'stream:unwatch'; socketId: string; viewerId: string }
  | { event: 'stream:quality'; socketId: string; viewerId: string; level: StreamQualityLevel }
  | { event: 'signal:receive'; socketId: string; signal: SignalReceive }

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

  roomParticipants(serverId: string, roomId: string, participants: Participant[]) {
    this.emitted.push({ event: 'room:participants', serverId, roomId, participants })
  }

  seatTaken(socketId: string, roomId: string) {
    this.emitted.push({ event: 'seat:taken', socketId, roomId })
  }

  seatReleased(socketId: string, roomId: string, reason: RoomLeft['reason'] | null) {
    this.emitted.push({ event: 'seat:released', socketId, roomId, reason })
  }

  watchRequested(socketId: string, viewerId: string) {
    this.emitted.push({ event: 'stream:watch-request', socketId, viewerId })
  }

  watchStopped(socketId: string, viewerId: string) {
    this.emitted.push({ event: 'stream:unwatch', socketId, viewerId })
  }

  qualityRequested(socketId: string, viewerId: string, level: StreamQualityLevel) {
    this.emitted.push({ event: 'stream:quality', socketId, viewerId, level })
  }

  signal(socketId: string, signal: SignalReceive) {
    this.emitted.push({ event: 'signal:receive', socketId, signal })
  }

  // Only the events of one kind.
  of<E extends Emitted['event']>(event: E): Extract<Emitted, { event: E }>[] {
    return this.emitted.filter((emitted): emitted is Extract<Emitted, { event: E }> => emitted.event === event)
  }
}

// Jobs wait until the test runs them.
export class FakeTimers extends Timers {
  readonly pending = new Map<string, () => Promise<void>>()

  schedule(key: string, _delayMs: number, job: () => Promise<void>) {
    this.pending.set(key, job)
  }

  cancel(key: string) {
    this.pending.delete(key)
  }

  async runAll() {
    const jobs = [...this.pending.values()]
    this.pending.clear()
    for (const job of jobs) await job()
  }
}

// Two servers: "ana" belongs to both, "bia" and "caio" only to the first.
// Rooms r1 and r2 are in s1, r3 in s2.
export function makeRealtimeContext() {
  const { servers, rooms, access } = makeServersContext()
  const presence = new InMemoryPresenceStore()
  const store = new InMemoryRoomStateStore()
  const emitter = new FakeRealtimeEmitter()
  const timers = new FakeTimers()
  const voice = new VoiceRoomsService(store, emitter, timers)
  servers.servers.set('s1', { ...baseServer, id: 's1' })
  servers.servers.set('s2', { ...baseServer, id: 's2' })
  servers.addMember('s1', 'ana', 'owner')
  servers.addMember('s2', 'ana', 'owner')
  servers.addMember('s1', 'bia', 'member')
  servers.addMember('s1', 'caio', 'member')
  rooms.rooms.push(
    { id: 'r1', serverId: 's1', name: 'Room 1', position: 0 },
    { id: 'r2', serverId: 's1', name: 'Room 2', position: 1 },
    { id: 'r3', serverId: 's2', name: 'Room 1', position: 0 },
  )
  const joinRoom = new JoinRoomUseCase(rooms, access, store, voice, emitter, timers)
  const releaseSeats = new ReleaseVoiceSeatsUseCase(store, voice)
  return {
    servers,
    presence,
    store,
    emitter,
    timers,
    connect: new ConnectSocketUseCase(presence, servers, emitter),
    disconnect: new DisconnectSocketUseCase(
      presence,
      servers,
      emitter,
      store,
      voice,
      timers,
      new VoiceRoomsConfig(30_000),
    ),
    subscribe: new SubscribeToServerUseCase(access, servers, presence, store),
    joinRoom,
    // Joins with a socket named after the user.
    join: (userId: string, roomId: string, socketId = `${userId}-tab`) =>
      joinRoom.execute({ userId, socketId, roomId, muted: false, deafened: false }),
    leaveRoom: new LeaveRoomUseCase(store, voice),
    updateVoiceState: new UpdateVoiceStateUseCase(store, voice),
    relay: new RelayToPeerUseCase(store, voice, emitter),
    releaseSeats,
    listener: new DomainEventsListener(emitter, presence, releaseSeats),
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
