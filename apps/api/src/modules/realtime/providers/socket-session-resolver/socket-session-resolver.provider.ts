import type { IncomingHttpHeaders } from 'node:http'

// Finds the user and session of a Socket.IO handshake: from the session cookie the REST routes use, or from
// the bearer token the desktop app sends in the handshake `auth`.
export abstract class SocketSessionResolver {
  // Null when there is no valid session.
  abstract resolve(headers: IncomingHttpHeaders, auth?: unknown): Promise<{ userId: string; sessionId: string } | null>
}
