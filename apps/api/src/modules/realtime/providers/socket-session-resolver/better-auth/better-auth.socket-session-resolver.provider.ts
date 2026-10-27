import type { IncomingHttpHeaders } from 'node:http'
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

  async resolve(headers: IncomingHttpHeaders): Promise<{ userId: string; sessionId: string } | null> {
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(headers) })
    return session ? { userId: session.user.id, sessionId: session.session.id } : null
  }
}
