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
import { type AckResponse, REALTIME_EVENTS } from '@gameplay/shared'
import { ZodValidationPipe } from 'nestjs-zod'
import { WsAckExceptionFilter } from '../../../common/errors/ws-ack-exception.filter'
import { AsyncApiReceive, AsyncApiSend } from '../../../docs/asyncapi-decorators'
import { isServerRoom, serverRoom, userRoom } from '../domain/socket-rooms'
import type { RealtimeServer, RealtimeSocket } from '../domain/socket-data'
import { PresenceSnapshotDto, ServerSubscribeDto } from '../dtos/realtime.dto'
import { SocketIoRealtimeEmitter } from '../providers/realtime-emitter'
import { SocketSessionResolver } from '../providers/socket-session-resolver'
import { ConnectSocketUseCase } from '../use-cases/connect-socket.use-case'
import { DisconnectSocketUseCase } from '../use-cases/disconnect-socket.use-case'
import { SubscribeToServerUseCase } from '../use-cases/subscribe-to-server.use-case'

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
    message: { payload: ServerSubscribeDto },
  })
  @AsyncApiSend({
    channel: REALTIME_EVENTS.presenceSnapshot,
    summary: 'Members online when the socket subscribed to the server',
    message: { payload: PresenceSnapshotDto },
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
    return { ok: true, data: undefined }
  }
}
