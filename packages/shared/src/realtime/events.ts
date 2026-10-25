import { z } from 'zod'
import type { Ack } from './ack.js'

// Socket.IO event names (`domain:action`). The direction lives in the
// ClientToServerEvents / ServerToClientEvents types, not in the name.
export const REALTIME_EVENTS = {
  serverSubscribe: 'server:subscribe',
  presenceSnapshot: 'presence:snapshot',
  presenceUpdate: 'presence:update',
  serverChanged: 'server:changed',
  serverRemoved: 'server:removed',
  sessionRevoked: 'session:revoked',
} as const

// Client asks to follow the server it has open. One server per socket:
// subscribing to another one stops the previous.
export const serverSubscribeSchema = z.object({ serverId: z.string().min(1) })
export type ServerSubscribe = z.infer<typeof serverSubscribeSchema>

// Sent to the subscribing socket: which members are online right now.
export const presenceSnapshotSchema = z.object({
  serverId: z.string(),
  onlineUserIds: z.array(z.string()),
})
export type PresenceSnapshot = z.infer<typeof presenceSnapshotSchema>

// A member opened their first tab (online) or closed the last one (offline).
export const presenceUpdateSchema = z.object({
  serverId: z.string(),
  userId: z.string(),
  online: z.boolean(),
})
export type PresenceUpdate = z.infer<typeof presenceUpdateSchema>

// Something of the server changed (details, rooms, members, join requests).
// The web invalidates the server queries; REST stays the source of the data.
export const serverChangedSchema = z.object({ serverId: z.string() })
export type ServerChanged = z.infer<typeof serverChangedSchema>

export const SERVER_REMOVED_REASONS = ['kicked', 'left', 'deleted'] as const
// Sent to each removed person; their sockets stop following the server.
// "left" reaches the other tabs of who left.
export const serverRemovedSchema = z.object({
  serverId: z.string(),
  reason: z.enum(SERVER_REMOVED_REASONS),
})
export type ServerRemoved = z.infer<typeof serverRemovedSchema>

export interface ClientToServerEvents {
  'server:subscribe': (payload: ServerSubscribe, ack: Ack) => void
}

export interface ServerToClientEvents {
  'presence:snapshot': (payload: PresenceSnapshot) => void
  'presence:update': (payload: PresenceUpdate) => void
  'server:changed': (payload: ServerChanged) => void
  'server:removed': (payload: ServerRemoved) => void
  // Suspended or sessions ended by the platform admin; the socket is closed next.
  'session:revoked': () => void
}
