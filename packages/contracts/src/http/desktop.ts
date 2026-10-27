import { z } from 'zod'

// The origin of the desktop app's pages (the `app://gameplay` protocol it serves its UI from). The API trusts
// it, so the app can call it from another origin with a bearer token.
export const DESKTOP_APP_ORIGIN = 'app://gameplay'

// What a Socket.IO client sends in the handshake `auth` when it has no session cookie (the desktop app): the
// session token the bearer plugin of Better Auth handed out at sign-in.
export const socketAuthSchema = z.object({ token: z.string().min(1).max(1024).optional() })
export type SocketAuth = z.infer<typeof socketAuthSchema>
