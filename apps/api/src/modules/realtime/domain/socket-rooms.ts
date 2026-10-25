// Socket.IO rooms the gateway uses. Each socket joins its user's room on
// connect, so a user is reached on every tab; server rooms follow
// server:subscribe.
const SERVER_PREFIX = 'server:'

export function userRoom(userId: string): string {
  return `user:${userId}`
}

export function serverRoom(serverId: string): string {
  return `${SERVER_PREFIX}${serverId}`
}

export function isServerRoom(room: string): boolean {
  return room.startsWith(SERVER_PREFIX)
}
