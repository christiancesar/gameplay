import type { AckResponse, ServerToClientEvents } from '@gameplay/contracts'
import { REALTIME_EVENTS } from '@gameplay/contracts'

import { createSocket } from '@/shared/lib/socket'

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

/** The slice of a Socket.IO client the app uses. The real `AppSocket` and the test fake both fit it. */
type SocketLike = {
  readonly connected: boolean
  /** False when Socket.IO will not retry on its own (client or server closed it, or the handshake was denied). */
  readonly active: boolean
  connect(): unknown
  disconnect(): unknown
  on(event: string, handler: (...args: never[]) => void): unknown
  off(event: string, handler: (...args: never[]) => void): unknown
  emit(event: string, ...args: unknown[]): unknown
}

type RealtimeService = {
  connect(): void
  disconnect(): void
  isConnected(): boolean
  /** Listens to one event of the contract. Returns the function that stops listening. */
  on<E extends keyof ServerToClientEvents>(event: E, handler: ServerToClientEvents[E]): () => void
  /** Reports connected / reconnecting / disconnected as the socket moves. Returns the unsubscribe. */
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void
  /** `server:subscribe` with its ack. Rejects when the API answers `{ ok: false }`. */
  subscribeToServer(serverId: string): Promise<void>
}

function listen(socket: SocketLike, event: string, handler: (...args: never[]) => void) {
  socket.on(event, handler)
  return () => {
    socket.off(event, handler)
  }
}

/**
 * Wraps the socket behind the small surface the ViewModels need. The socket is created on the first
 * call, so importing this module never opens anything.
 */
function createRealtimeService(getSocket: () => SocketLike): RealtimeService {
  return {
    connect: () => {
      const socket = getSocket()
      if (!socket.connected) socket.connect()
    },
    disconnect: () => {
      getSocket().disconnect()
    },
    isConnected: () => getSocket().connected,
    on: (event, handler) => listen(getSocket(), event, handler as (...args: never[]) => void),
    onStatusChange: (handler) => {
      const socket = getSocket()
      const stops = [
        listen(socket, 'connect', () => handler('connected')),
        listen(socket, 'disconnect', () => {
          // Closed by the client or the server: Socket.IO will not retry, so nothing is "reconnecting".
          if (!socket.active) {
            handler('disconnected')
            return
          }
          handler('reconnecting')
        }),
        listen(socket, 'connect_error', () => handler(socket.active ? 'reconnecting' : 'disconnected')),
      ]
      return () => stops.forEach((stop) => stop())
    },
    subscribeToServer: (serverId) =>
      new Promise<void>((resolve, reject) => {
        getSocket().emit(REALTIME_EVENTS.serverSubscribe, { serverId }, (response: AckResponse) => {
          if (response.ok) resolve()
          else reject(new Error(response.error.code))
        })
      }),
  }
}

let socket: SocketLike | undefined

/**
 * One socket per browser tab, held at module level. React context would add nothing: the socket is not
 * reactive state, the `_authed` layout opens and closes it, and ViewModels only call methods or listen to events.
 */
const realtime = createRealtimeService(() => (socket ??= createSocket() as unknown as SocketLike))

export { createRealtimeService, realtime }
export type { ConnectionStatus, RealtimeService, SocketLike }
