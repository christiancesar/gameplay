import type { ClientToServerEvents, ServerToClientEvents } from '@gameplay/contracts'
import { io, type Socket } from 'socket.io-client'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

/** Socket da API no mesmo domínio, autenticado pelo cookie da sessão. Conecta só quando pedido. */
function createSocket(): AppSocket {
  return io({ autoConnect: false, withCredentials: true })
}

export { createSocket }
export type { AppSocket }
