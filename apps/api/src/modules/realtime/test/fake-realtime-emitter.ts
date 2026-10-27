import type {
  Announcement,
  MediaChanged,
  StreamEnded,
  StreamReceived,
  Participant,
  RoomLeft,
  ServerRemoved,
  SignalReceive,
  StreamQualityLevel,
} from '@gameplay/contracts'
import { type MediaAudience, RealtimeEmitter } from '../providers/realtime-emitter/realtime-emitter.provider'

type Emitted =
  | { event: 'presence:update'; serverIds: string[]; userId: string; online: boolean }
  | { event: 'server:changed'; serverId: string }
  | { event: 'server:removed'; userIds: string[]; removal: ServerRemoved }
  | { event: 'session:revoked'; userId: string }
  | { event: 'session:ended'; sessionId: string }
  | { event: 'room:participants'; serverId: string; roomId: string; participants: Participant[] }
  | { event: 'seat:taken'; socketId: string; roomId: string }
  | { event: 'seat:released'; socketId: string; roomId: string; reason: RoomLeft['reason'] | null }
  | { event: 'stream:watch-request'; socketId: string; viewerId: string }
  | { event: 'stream:unwatch'; socketId: string; viewerId: string }
  | { event: 'stream:quality'; socketId: string; viewerId: string; level: StreamQualityLevel }
  | { event: 'signal:receive'; socketId: string; signal: SignalReceive }
  | { event: 'notification:new'; userId: string; notificationId: string; announcement?: Announcement }
  | { event: 'media:changed'; to: MediaAudience; change: MediaChanged }
  | { event: 'stream:ended'; socketId: string; ended: StreamEnded }
  | { event: 'stream:received'; socketId: string; received: StreamReceived }

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

  sessionEnded(sessionId: string) {
    this.emitted.push({ event: 'session:ended', sessionId })
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

  notificationNew(userId: string, notificationId: string, announcement?: Announcement) {
    this.emitted.push({ event: 'notification:new', userId, notificationId, ...(announcement && { announcement }) })
  }

  // Only the events of one kind.
  of<E extends Emitted['event']>(event: E): Extract<Emitted, { event: E }>[] {
    return this.emitted.filter((emitted): emitted is Extract<Emitted, { event: E }> => emitted.event === event)
  }

  mediaChanged(to: MediaAudience, change: MediaChanged) {
    this.emitted.push({ event: 'media:changed', to, change })
  }

  streamEnded(socketId: string, ended: StreamEnded) {
    this.emitted.push({ event: 'stream:ended', socketId, ended })
  }

  streamReceived(socketId: string, received: StreamReceived) {
    this.emitted.push({ event: 'stream:received', socketId, received })
  }
}
