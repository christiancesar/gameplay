import type {
  AckResponse,
  Participant,
  RoomJoin,
  ServerToClientEvents,
  SignalSend,
  VoiceState,
} from '@gameplay/contracts'
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
  /** `room:join`: takes the seat (leaving any other) and resolves with who is in the room. */
  joinRoom(payload: RoomJoin): Promise<Participant[]>
  /** `room:leave` */
  leaveRoom(): Promise<void>
  /** `voice:state`: mute and deafen as the others should see them. */
  sendVoiceState(state: VoiceState): Promise<void>
  /** `signal:send`: offer, answer or ICE candidate for someone in the same room. */
  sendSignal(signal: SignalSend): Promise<void>
}

/** The API did not answer an event in time (socket dropped before the ack). */
const ACK_TIMEOUT_MS = 10_000

/** Emits an event with an ack. Rejects with the API error code, or `ACK_TIMEOUT` when nobody answers. */
function emitWithAck<T>(socket: SocketLike, event: string, payload: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('ACK_TIMEOUT')), ACK_TIMEOUT_MS)
    socket.emit(event, payload, (response: AckResponse<T>) => {
      clearTimeout(timer)
      if (response.ok) resolve(response.data)
      else reject(new Error(response.error.code))
    })
  })
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
    joinRoom: async (payload) =>
      (await emitWithAck<{ participants: Participant[] }>(getSocket(), REALTIME_EVENTS.roomJoin, payload)).participants,
    leaveRoom: () => emitWithAck<void>(getSocket(), REALTIME_EVENTS.roomLeave, {}),
    sendVoiceState: (state) => emitWithAck<void>(getSocket(), REALTIME_EVENTS.voiceState, state),
    sendSignal: (signal) => emitWithAck<void>(getSocket(), REALTIME_EVENTS.signalSend, signal),
  }
}

let socket: SocketLike | undefined

/**
 * One socket per browser tab, held at module level. React context would add nothing: the socket is not
 * reactive state, the `_authed` layout opens and closes it, and ViewModels only call methods or listen to events.
 */
const realtime = createRealtimeService(() => (socket ??= createSocket() as unknown as SocketLike))

export { ACK_TIMEOUT_MS, createRealtimeService, realtime }
export type { ConnectionStatus, RealtimeService, SocketLike }
