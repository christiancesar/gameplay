import type { IncomingHttpHeaders } from 'node:http'
import { socketAuthSchema } from '@gameplay/contracts'
import { Injectable } from '@nestjs/common'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { fromNodeHeaders } from 'better-auth/node'
import type { Auth } from '../../../../../lib/auth'
import { SocketSessionResolver } from '../socket-session-resolver.provider'

@Injectable()
export class BetterAuthSocketSessionResolver extends SocketSessionResolver {
  constructor(private readonly auth: AuthService<Auth>) {
    super()
  }

  async resolve(headers: IncomingHttpHeaders, auth?: unknown): Promise<{ userId: string; sessionId: string } | null> {
    const requestHeaders = fromNodeHeaders(headers)
    // A browser can't set headers on a WebSocket, so the desktop app sends the token in the handshake `auth`.
    const token = socketAuthSchema.safeParse(auth).data?.token
    if (token && !requestHeaders.has('authorization')) requestHeaders.set('authorization', `Bearer ${token}`)
    const session = await this.auth.api.getSession({ headers: requestHeaders })
    return session ? { userId: session.user.id, sessionId: session.session.id } : null
  }
}
