import { Injectable } from '@nestjs/common'
import {
  type Announcement,
  type MediaChanged,
  type StreamEnded,
  type Participant,
  REALTIME_EVENTS,
  type RoomLeft,
  type ServerRemoved,
  type SignalReceive,
  type StreamQualityLevel,
} from '@gameplay/contracts'
import { AsyncApi, AsyncApiSend } from '../../../../../docs/asyncapi-decorators'
import { serverRoom, sessionRoom, userRoom, voiceRoom } from '../../../domain/socket-rooms'
import type { RealtimeServer } from '../../../domain/socket-data'
import {
  NoPayloadDto,
  MediaChangedDto,
  NotificationNewDto,
  PresenceUpdateDto,
  RoomLeftDto,
  RoomParticipantsDto,
  ServerChangedDto,
  ServerRemovedDto,
  SignalReceiveDto,
  StreamEndedDto,
  StreamViewerDto,
  StreamViewerQualityDto,
} from '../../../dtos/realtime.dto'
import { type MediaAudience, RealtimeEmitter } from '../realtime-emitter.provider'

// Socket.IO implementation; the gateway hands it the server on init. Before
// that (or without a gateway) nothing is connected, so emits are skipped.
@Injectable()
@AsyncApi()
export class SocketIoRealtimeEmitter extends RealtimeEmitter {
  private server: RealtimeServer | null = null

  attach(server: RealtimeServer) {
    this.server = server
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.presenceUpdate,
    summary: 'A member went online (first tab) or offline (last tab closed)',
    message: { name: 'PresenceUpdate', payload: PresenceUpdateDto },
  })
  presenceUpdate(serverIds: string[], { userId, online }: { userId: string; online: boolean }) {
    for (const serverId of serverIds) {
      this.server?.to(serverRoom(serverId)).emit(REALTIME_EVENTS.presenceUpdate, { serverId, userId, online })
    }
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.serverChanged,
    summary: 'Details, rooms, members or join requests of the server changed; refetch them',
    message: { name: 'ServerChanged', payload: ServerChangedDto },
  })
  serverChanged(serverId: string) {
    this.server?.to(serverRoom(serverId)).emit(REALTIME_EVENTS.serverChanged, { serverId })
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.serverRemoved,
    summary: 'You are no longer in the server: kicked, left in another tab, or the server was deleted',
    message: { name: 'ServerRemoved', payload: ServerRemovedDto },
  })
  serverRemoved(userIds: string[], removal: ServerRemoved) {
    if (!this.server || userIds.length === 0) return
    const rooms = userIds.map(userRoom)
    this.server.to(rooms).emit(REALTIME_EVENTS.serverRemoved, removal)
    this.server.in(rooms).socketsLeave(serverRoom(removal.serverId))
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.sessionRevoked,
    summary:
      'Suspended, or sessions ended by the platform admin (all of them or this one); the socket closes right after',
    message: { name: 'SessionRevoked', payload: NoPayloadDto },
  })
  sessionRevoked(userId: string) {
    if (!this.server) return
    this.server.to(userRoom(userId)).emit(REALTIME_EVENTS.sessionRevoked)
    this.server.in(userRoom(userId)).disconnectSockets()
  }

  sessionEnded(sessionId: string) {
    if (!this.server) return
    this.server.to(sessionRoom(sessionId)).emit(REALTIME_EVENTS.sessionRevoked)
    this.server.in(sessionRoom(sessionId)).disconnectSockets()
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.roomParticipants,
    summary: 'Who is in a voice room now, with mute, deafen and screen share',
    message: { name: 'RoomParticipants', payload: RoomParticipantsDto },
  })
  roomParticipants(serverId: string, roomId: string, participants: Participant[]) {
    this.server
      ?.to([serverRoom(serverId), voiceRoom(roomId)])
      .emit(REALTIME_EVENTS.roomParticipants, { serverId, roomId, participants })
  }

  seatTaken(socketId: string, roomId: string) {
    this.server?.in(socketId).socketsJoin(voiceRoom(roomId))
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.roomLeft,
    summary: 'This tab is out of the voice room: joined from another tab, room deleted, or out of the server',
    message: { name: 'RoomLeft', payload: RoomLeftDto },
  })
  seatReleased(socketId: string, roomId: string, reason: RoomLeft['reason'] | null) {
    if (!this.server) return
    if (reason) this.server.to(socketId).emit(REALTIME_EVENTS.roomLeft, { roomId, reason })
    this.server.in(socketId).socketsLeave(voiceRoom(roomId))
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.streamWatchRequest,
    summary: 'To the streamer: this viewer wants the screen; send it to them',
    message: { name: 'StreamWatchRequest', payload: StreamViewerDto },
  })
  watchRequested(socketId: string, viewerId: string) {
    this.server?.to(socketId).emit(REALTIME_EVENTS.streamWatchRequest, { viewerId })
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.streamUnwatch,
    summary: 'To the streamer: this viewer stopped watching; stop sending the screen',
    message: { name: 'StreamViewerLeft', payload: StreamViewerDto },
  })
  watchStopped(socketId: string, viewerId: string) {
    this.server?.to(socketId).emit(REALTIME_EVENTS.streamUnwatch, { viewerId })
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.streamQuality,
    summary: 'To the streamer: lower or raise the encoding of this one viewer',
    message: { name: 'StreamViewerQuality', payload: StreamViewerQualityDto },
  })
  qualityRequested(socketId: string, viewerId: string, level: StreamQualityLevel) {
    this.server?.to(socketId).emit(REALTIME_EVENTS.streamQuality, { viewerId, level })
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.signalReceive,
    summary: 'WebRTC offer, answer or ICE candidate from someone in the same voice room',
    message: { name: 'SignalReceive', payload: SignalReceiveDto },
  })
  signal(socketId: string, signal: SignalReceive) {
    this.server?.to(socketId).emit(REALTIME_EVENTS.signalReceive, signal)
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.notificationNew,
    summary: 'A Hub notification was stored for you; refetch GET /api/me/notifications',
    message: { name: 'NotificationNew', payload: NotificationNewDto },
  })
  notificationNew(userId: string, notificationId: string, announcement?: Announcement) {
    this.server?.to(userRoom(userId)).emit(REALTIME_EVENTS.notificationNew, { id: notificationId, announcement })
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.mediaChanged,
    summary: 'The platform admin changed the media resources; refetch what the server offers',
    message: { name: 'MediaChanged', payload: MediaChangedDto },
  })
  mediaChanged(to: MediaAudience, change: MediaChanged) {
    if (!this.server) return
    if (to === 'everyone') this.server.emit(REALTIME_EVENTS.mediaChanged, change)
    else if ('serverId' in to) this.server.to(serverRoom(to.serverId)).emit(REALTIME_EVENTS.mediaChanged, change)
    else if (to.userIds.length > 0) this.server.to(to.userIds.map(userRoom)).emit(REALTIME_EVENTS.mediaChanged, change)
  }

  @AsyncApiSend({
    channel: REALTIME_EVENTS.streamEnded,
    summary: 'Your screen share was stopped by the API (the mode was turned off)',
    message: { name: 'StreamEnded', payload: StreamEndedDto },
  })
  streamEnded(socketId: string, ended: StreamEnded) {
    this.server?.to(socketId).emit(REALTIME_EVENTS.streamEnded, ended)
  }
}
