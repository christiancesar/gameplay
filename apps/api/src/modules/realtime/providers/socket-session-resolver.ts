import type { IncomingHttpHeaders } from 'node:http'
import { Injectable } from '@nestjs/common'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { fromNodeHeaders } from 'better-auth/node'
import type { Auth } from '../../../lib/auth'

// Finds the user of a Socket.IO handshake from the same session cookie the
// REST routes use.
export abstract class SocketSessionResolver {
  // Null when there is no valid session.
  abstract resolve(headers: IncomingHttpHeaders): Promise<string | null>
}

@Injectable()
export class BetterAuthSocketSessionResolver extends SocketSessionResolver {
  constructor(private readonly auth: AuthService<Auth>) {
    super()
  }

  async resolve(headers: IncomingHttpHeaders): Promise<string | null> {
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(headers) })
    return session?.user.id ?? null
  }
}
