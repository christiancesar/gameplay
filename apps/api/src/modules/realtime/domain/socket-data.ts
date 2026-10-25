import type { ClientToServerEvents, ServerToClientEvents } from '@gameplay/shared'
import type { Server, Socket } from 'socket.io'

// Set by the handshake middleware; every connected socket has a user.
export type SocketData = { userId: string }

export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
export type RealtimeSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
