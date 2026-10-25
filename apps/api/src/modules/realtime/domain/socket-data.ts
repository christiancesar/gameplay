import type { ClientToServerEvents, ServerToClientEvents } from '@gameplay/contracts'
import type { Server, Socket } from 'socket.io'

// Set by the handshake middleware; every connected socket has a user and the
// session its cookie belongs to.
export type SocketData = { userId: string; sessionId: string }

export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
export type RealtimeSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
