import { Logger, UseFilters, UseInterceptors, UsePipes } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { type AckResponse, DESKTOP_APP_ORIGIN, REALTIME_EVENTS, type RoomJoinResult } from '@gameplay/contracts'
import { ZodValidationPipe } from 'nestjs-zod'
import { WsAckExceptionFilter } from '../../../common/errors/ws-ack-exception.filter'
import { AsyncApiReceive, AsyncApiSend } from '../../../docs/asyncapi-decorators'
import { isServerRoom, serverRoom, sessionRoom, userRoom } from '../domain/socket-rooms'
import type { RealtimeServer, RealtimeSocket } from '../domain/socket-data'
import {
  NoPayloadDto,
  PresenceSnapshotDto,
  RoomJoinDto,
  RoomJoinResultDto,
  ServerSubscribeDto,
  SignalSendDto,
  MediaUsageDto,
  StreamQualityDto,
  StreamStartDto,
  StreamTargetDto,
  VoiceStateDto,
} from '../dtos/realtime.dto'
import { RealtimeMetricsInterceptor } from '../interceptors/realtime-metrics.interceptor'
import { SocketIoRealtimeEmitter } from '../providers/realtime-emitter/socket-io/socket-io.realtime-emitter.provider'
import { RealtimeMetrics } from '../providers/realtime-metrics/realtime-metrics.provider'
import { SocketSessionResolver } from '../providers/socket-session-resolver/socket-session-resolver.provider'
import { ConnectSocketUseCase } from '../use-cases/connect-socket.use-case'
import { DisconnectSocketUseCase } from '../use-cases/disconnect-socket.use-case'
import { JoinRoomUseCase } from '../use-cases/join-room.use-case'
import { LeaveRoomUseCase } from '../use-cases/leave-room.use-case'
import { RelayToPeerUseCase } from '../use-cases/relay-to-peer.use-case'
import { ReportMediaUsageUseCase } from '../use-cases/report-media-usage.use-case'
import { SubscribeToServerUseCase } from '../use-cases/subscribe-to-server.use-case'
import { UpdateVoiceStateUseCase } from '../use-cases/update-voice-state.use-case'

const OK: AckResponse = { ok: true, data: undefined }

// Code of the connect_error a client gets without a valid session.
export const UNAUTHENTICATED = 'UNAUTHENTICATED'

// Socket.IO on /socket.io, same origin and session cookie as the REST API. The desktop app comes from its own
// origin (CORS for the polling transport) and brings the session token in the handshake.
@WebSocketGateway({ cors: { origin: [DESKTOP_APP_ORIGIN], credentials: true } })
@UsePipes(ZodValidationPipe)
@UseFilters(WsAckExceptionFilter)
@UseInterceptors(RealtimeMetricsInterceptor)
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name)

  constructor(
    private readonly sessions: SocketSessionResolver,
    private readonly emitter: SocketIoRealtimeEmitter,
    private readonly metrics: RealtimeMetrics,
    private readonly connectSocket: ConnectSocketUseCase,
    private readonly disconnectSocket: DisconnectSocketUseCase,
    private readonly subscribeToServer: SubscribeToServerUseCase,
    private readonly joinRoom: JoinRoomUseCase,
    private readonly leaveRoom: LeaveRoomUseCase,
    private readonly updateVoiceState: UpdateVoiceStateUseCase,
    private readonly relayToPeer: RelayToPeerUseCase,
    private readonly reportMediaUsage: ReportMediaUsageUseCase,
  ) {}

  // The handshake is the gate: a socket without a session never connects,
  // so no handler runs for it.
  afterInit(server: RealtimeServer) {
    this.emitter.attach(server)
    server.use((socket, next) => {
      this.sessions.resolve(socket.request.headers, socket.handshake.auth).then(
        (resolved) => {
          if (!resolved) {
            this.metrics.handshakeRejected()
            return next(new Error(UNAUTHENTICATED))
          }
          socket.data.userId = resolved.userId
          socket.data.sessionId = resolved.sessionId
          next()
        },
        (error: unknown) => next(error instanceof Error ? error : new Error(String(error))),
      )
    })
  }

  async handleConnection(socket: RealtimeSocket) {
    const { userId } = socket.data
    this.metrics.socketOpened()
    this.logger.log({ userId, socketId: socket.id }, 'Socket connected')
    // Nest's disconnect hook drops the reason; Socket.IO gives it here.
    socket.once('disconnect', (reason) => {
      this.metrics.socketClosed(reason)
      this.logger.log({ userId, socketId: socket.id, reason }, 'Socket disconnected')
    })
    await socket.join([userRoom(userId), sessionRoom(socket.data.sessionId)])
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
    summary: 'Started sharing the screen with this preset and mode (also to change them)',
    message: { name: 'StreamStart', payload: StreamStartDto },
  })
  async streamStart(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { preset, mode }: StreamStartDto,
  ): Promise<AckResponse> {
    await this.updateVoiceState.execute({ ...this.who(socket), streaming: preset, streamMode: mode })
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

  @SubscribeMessage(REALTIME_EVENTS.mediaUsage)
  @AsyncApiReceive({
    channel: REALTIME_EVENTS.mediaUsage,
    summary: 'Watching through the SFU: bytes received since the last report and the quality that arrives',
    message: { name: 'MediaUsage', payload: MediaUsageDto },
  })
  async mediaUsage(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() { streamerId, bytes, quality }: MediaUsageDto,
  ): Promise<AckResponse> {
    await this.reportMediaUsage.execute({ ...this.who(socket), streamerId, bytes, quality })
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
