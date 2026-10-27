import type { IncomingHttpHeaders } from 'node:http'

// Finds the user and session of a Socket.IO handshake from the same session cookie the
// REST routes use.
export abstract class SocketSessionResolver {
  // Null when there is no valid session.
  abstract resolve(headers: IncomingHttpHeaders): Promise<{ userId: string; sessionId: string } | null>
}
