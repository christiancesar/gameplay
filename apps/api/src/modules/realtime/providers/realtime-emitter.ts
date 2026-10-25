import { Injectable } from '@nestjs/common'
import {
  type Participant,
  REALTIME_EVENTS,
  type RoomLeft,
  type ServerRemoved,
  type SignalReceive,
  type StreamQualityLevel,
} from '@gameplay/shared'
import { AsyncApi, AsyncApiSend } from '../../../docs/asyncapi-decorators'
import { serverRoom, userRoom, voiceRoom } from '../domain/socket-rooms'
import type { RealtimeServer } from '../domain/socket-data'
import {
  NoPayloadDto,
  PresenceUpdateDto,
  RoomLeftDto,
  RoomParticipantsDto,
  ServerChangedDto,
  ServerRemovedDto,
  SignalReceiveDto,
  StreamViewerDto,
  StreamViewerQualityDto,
} from '../dtos/realtime.dto'

// What the API tells connected clients without being asked. Use-cases and the
// domain events listener talk to this; tests use a fake.
export abstract class RealtimeEmitter {
  abstract presenceUpdate(serverIds: string[], update: { userId: string; online: boolean }): void
  abstract serverChanged(serverId: string): void
  // Tells each user and makes all their sockets stop following the server.
  abstract serverRemoved(userIds: string[], removal: ServerRemoved): void
  // Tells the user and closes all their sockets.
  abstract sessionRevoked(userId: string): void
  // To who follows the server and to the room itself.
  abstract roomParticipants(serverId: string, roomId: string, participants: Participant[]): void
  // The socket took a seat: it hears about the room even with another server open.
  abstract seatTaken(socketId: string, roomId: string): void
  // The socket lost its seat; with a reason, it is told (it did not ask).
  abstract seatReleased(socketId: string, roomId: string, reason: RoomLeft['reason'] | null): void
  // To the streamer's socket.
  abstract watchRequested(socketId: string, viewerId: string): void
  abstract watchStopped(socketId: string, viewerId: string): void
  abstract qualityRequested(socketId: string, viewerId: string, level: StreamQualityLevel): void
  abstract signal(socketId: string, signal: SignalReceive): void
}

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
    summary: 'Suspended or sessions ended by the platform admin; the socket closes right after',
    message: { name: 'SessionRevoked', payload: NoPayloadDto },
  })
  sessionRevoked(userId: string) {
    if (!this.server) return
    this.server.to(userRoom(userId)).emit(REALTIME_EVENTS.sessionRevoked)
    this.server.in(userRoom(userId)).disconnectSockets()
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
}
