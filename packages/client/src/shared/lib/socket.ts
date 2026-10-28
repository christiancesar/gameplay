import type { ClientToServerEvents, ServerToClientEvents } from '@gameplay/contracts'
import { io, type Socket } from 'socket.io-client'

import { currentPlatform } from '@/shared/platform/current-platform'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

/**
 * Socket da API, autenticado pelo cookie da sessão. No web conecta no mesmo domínio; no desktop, no servidor escolhido.
 * Conecta só quando pedido.
 */
function createSocket(): AppSocket {
  const options = { autoConnect: false, withCredentials: true }
  const url = currentPlatform().server.baseUrl()
  return url ? io(url, options) : io(options)
}

export { createSocket }
export type { AppSocket }
