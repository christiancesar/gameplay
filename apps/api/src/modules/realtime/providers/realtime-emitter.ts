import { Injectable } from '@nestjs/common'
import { REALTIME_EVENTS, type ServerRemoved } from '@gameplay/shared'
import { AsyncApi, AsyncApiSend } from '../../../docs/asyncapi-decorators'
import { serverRoom, userRoom } from '../domain/socket-rooms'
import type { RealtimeServer } from '../domain/socket-data'
import { NoPayloadDto, PresenceUpdateDto, ServerChangedDto, ServerRemovedDto } from '../dtos/realtime.dto'

// What the API tells connected clients without being asked. Use-cases and the
// domain events listener talk to this; tests use a fake.
export abstract class RealtimeEmitter {
  abstract presenceUpdate(serverIds: string[], update: { userId: string; online: boolean }): void
  abstract serverChanged(serverId: string): void
  // Tells each user and makes all their sockets stop following the server.
  abstract serverRemoved(userIds: string[], removal: ServerRemoved): void
  // Tells the user and closes all their sockets.
  abstract sessionRevoked(userId: string): void
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
}
