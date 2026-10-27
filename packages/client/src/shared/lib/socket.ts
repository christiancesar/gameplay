import type { ClientToServerEvents, ServerToClientEvents, SocketAuth } from '@gameplay/contracts'
import { io, type Socket } from 'socket.io-client'

import { currentPlatform } from '@/shared/platform/current-platform'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

/**
 * Socket da API. No web conecta no mesmo domínio, autenticado pelo cookie da sessão. No desktop conecta no
 * servidor escolhido e manda o token da sessão no handshake (um browser não põe header num WebSocket). O token é
 * lido a cada tentativa de conexão. Conecta só quando pedido.
 */
function createSocket(): AppSocket {
  const { server } = currentPlatform()
  const options = {
    autoConnect: false,
    withCredentials: true,
    auth: (send: (auth: SocketAuth) => void) => {
      const token = server.session.getToken()
      send(token ? { token } : {})
    },
  }
  const url = server.baseUrl()
  return url ? io(url, options) : io(options)
}

export { createSocket }
export type { AppSocket }
