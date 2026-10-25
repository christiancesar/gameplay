import { Logger, UseFilters, UsePipes } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { type AckResponse, REALTIME_EVENTS, type RoomJoinResult } from '@gameplay/contracts'
import { ZodValidationPipe } from 'nestjs-zod'
import { WsAckExceptionFilter } from '../../../common/errors/ws-ack-exception.filter'
import { AsyncApiReceive, AsyncApiSend } from '../../../docs/asyncapi-decorators'
import { isServerRoom, serverRoom, userRoom } from '../domain/socket-rooms'
import type { RealtimeServer, RealtimeSocket } from '../domain/socket-data'
import {
  NoPayloadDto,
  PresenceSnapshotDto,
  RoomJoinDto,
  RoomJoinResultDto,
  ServerSubscribeDto,
  SignalSendDto,
  StreamQualityDto,
  StreamStartDto,
  StreamTargetDto,
  VoiceStateDto,
} from '../dtos/realtime.dto'
import { SocketIoRealtimeEmitter } from '../providers/realtime-emitter'
import { SocketSessionResolver } from '../providers/socket-session-resolver'
import { ConnectSocketUseCase } from '../use-cases/connect-socket.use-case'
import { DisconnectSocketUseCase } from '../use-cases/disconnect-socket.use-case'
import { JoinRoomUseCase } from '../use-cases/join-room.use-case'
import { LeaveRoomUseCase } from '../use-cases/leave-room.use-case'
import { RelayToPeerUseCase } from '../use-cases/relay-to-peer.use-case'
import { SubscribeToServerUseCase } from '../use-cases/subscribe-to-server.use-case'
import { UpdateVoiceStateUseCase } from '../use-cases/update-voice-state.use-case'

const OK: AckResponse = { ok: true, data: undefined }

// Code of the connect_error a client gets without a valid session.
export const UNAUTHENTICATED = 'UNAUTHENTICATED'

// Socket.IO on /socket.io, same origin and session cookie as the REST API.
@WebSocketGateway()
@UsePipes(ZodValidationPipe)
@UseFilters(WsAckExceptionFilter)
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name)

  constructor(
    private readonly sessions: SocketSessionResolver,
    private readonly emitter: SocketIoRealtimeEmitter,
    private readonly connectSocket: ConnectSocketUseCase,
    private readonly disconnectSocket: DisconnectSocketUseCase,
    private readonly subscribeToServer: SubscribeToServerUseCase,
    private readonly joinRoom: JoinRoomUseCase,
    private readonly leaveRoom: LeaveRoomUseCase,
    private readonly updateVoiceState: UpdateVoiceStateUseCase,
    private readonly relayToPeer: RelayToPeerUseCase,
  ) {}

  // The handshake is the gate: a socket without a session never connects,
  // so no handler runs for it.
  afterInit(server: RealtimeServer) {
    this.emitter.attach(server)
    server.use((socket, next) => {
      this.sessions.resolve(socket.request.headers).then(
        (userId) => {
          if (!userId) return next(new Error(UNAUTHENTICATED))
          socket.data.userId = userId
          next()
        },
        (error: unknown) => next(error instanceof Error ? error : new Error(String(error))),
      )
    })
  }

  async handleConnection(socket: RealtimeSocket) {
    const { userId } = socket.data
    await socket.join(userRoom(userId))
    await this.connectSocket
      .execute({ userId, socketId: socket.id })
      .catch((error: unknown) => this.logger.error({ err: error, userId }, 'Could not mark the user online'))
  }

  async handleDisconnect(socket: RealtimeSocket) {
    const { userId } = socket.data
    if (!userId) return
    await this.disconnectSocket
      .execute({ userId, socketId: socket.id })
      .catch((error: unknown) => this.logger.error({ err: error, userId }, 'Could not mark the user offline'))
  }

  @SubscribeMessage(REALTIME_EVENTS.serverSubscribe)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.serverSubscribe,
    summary: 'Follow the open server (members only); stops following the previous one. Ack: { ok } or { ok, error }',
    message: { name: 'ServerSubscribe', payload: ServerSubscribeDto },
  })
  @AsyncApiSend({
    channel: REALTIME_EVENTS.presenceSnapshot,
    summary: 'Members online when the socket subscribed to the server',
    message: { name: 'PresenceSnapshot', payload: PresenceSnapshotDto },
  })
  async subscribe(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { serverId }: ServerSubscribeDto,
  ): Promise<AckResponse> {
    const snapshot = await this.subscribeToServer.execute({ serverId, userId: socket.data.userId })
    for (const room of socket.rooms) {
      if (isServerRoom(room) && room !== serverRoom(serverId)) await socket.leave(room)
    }
    await socket.join(serverRoom(serverId))
    socket.emit(REALTIME_EVENTS.presenceSnapshot, snapshot)
    return OK
  }

  @SubscribeMessage(REALTIME_EVENTS.roomJoin)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.roomJoin,
    summary: 'Enter a voice room (members only), leaving the previous one in any tab. Ack: the participants',
    message: { name: 'RoomJoin', payload: RoomJoinDto },
  })
  @AsyncApiSend({
    channel: REALTIME_EVENTS.roomJoin,
    summary: 'Ack of room:join: { ok: true, data: { participants } }',
    message: { name: 'RoomJoinResult', payload: RoomJoinResultDto },
  })
  async join(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { roomId, muted, deafened }: RoomJoinDto,
  ): Promise<AckResponse<RoomJoinResult>> {
    const data = await this.joinRoom.execute({ ...this.who(socket), roomId, muted, deafened })
    return { ok: true, data }
  }

  @SubscribeMessage(REALTIME_EVENTS.roomLeave)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.roomLeave,
    summary: 'Leave the voice room this tab is in',
    message: { name: 'RoomLeave', payload: NoPayloadDto },
  })
  async leave(@ConnectedSocket() socket: RealtimeSocket): Promise<AckResponse> {
    await this.leaveRoom.execute(this.who(socket))
    return OK
  }

  @SubscribeMessage(REALTIME_EVENTS.voiceState)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.voiceState,
    summary: 'Mute and deafen of this tab in its voice room',
    message: { name: 'VoiceState', payload: VoiceStateDto },
  })
  async voiceState(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { muted, deafened }: VoiceStateDto,
  ): Promise<AckResponse> {
    await this.updateVoiceState.execute({ ...this.who(socket), muted, deafened })
    return OK
  }

  @SubscribeMessage(REALTIME_EVENTS.streamStart)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.streamStart,
    summary: 'Started sharing the screen with this preset (also to change the preset)',
    message: { name: 'StreamStart', payload: StreamStartDto },
  })
  async streamStart(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { preset }: StreamStartDto,
  ): Promise<AckResponse> {
    await this.updateVoiceState.execute({ ...this.who(socket), streaming: preset })
    return OK
  }

  @SubscribeMessage(REALTIME_EVENTS.streamStop)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.streamStop,
    summary: 'Stopped sharing the screen',
    message: { name: 'StreamStop', payload: NoPayloadDto },
  })
  async streamStop(@ConnectedSocket() socket: RealtimeSocket): Promise<AckResponse> {
    await this.updateVoiceState.execute({ ...this.who(socket), streaming: null })
    return OK
  }

  @SubscribeMessage(REALTIME_EVENTS.streamWatch)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.streamWatch,
    summary: 'Ask a streamer in the same room for their screen',
    message: { name: 'StreamWatch', payload: StreamTargetDto },
  })
  async streamWatch(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { streamerId }: StreamTargetDto,
  ): Promise<AckResponse> {
    await this.relayToPeer.execute({ ...this.who(socket), message: { type: 'watch', streamerId } })
    return OK
  }

  @SubscribeMessage(REALTIME_EVENTS.streamUnwatch)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.streamUnwatch,
    summary: 'Stop watching a streamer in the same room',
    message: { name: 'StreamUnwatch', payload: StreamTargetDto },
  })
  async streamUnwatch(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { streamerId }: StreamTargetDto,
  ): Promise<AckResponse> {
    await this.relayToPeer.execute({ ...this.who(socket), message: { type: 'unwatch', streamerId } })
    return OK
  }

  @SubscribeMessage(REALTIME_EVENTS.streamQuality)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.streamQuality,
    summary: 'Ask the streamer for another quality on this connection only',
    message: { name: 'StreamQuality', payload: StreamQualityDto },
  })
  async streamQuality(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { streamerId, level }: StreamQualityDto,
  ): Promise<AckResponse> {
    await this.relayToPeer.execute({ ...this.who(socket), message: { type: 'quality', streamerId, level } })
    return OK
  }

  @SubscribeMessage(REALTIME_EVENTS.signalSend)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.signalSend,
    summary: 'WebRTC offer, answer or ICE candidate for someone in the same voice room',
    message: { name: 'SignalSend', payload: SignalSendDto },
  })
  async signalSend(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { to, kind, data }: SignalSendDto,
  ): Promise<AckResponse> {
    await this.relayToPeer.execute({ ...this.who(socket), message: { type: 'signal', to, kind, data } })
    return OK
  }

  private who(socket: RealtimeSocket) {
    return { userId: socket.data.userId, socketId: socket.id }
  }
}
