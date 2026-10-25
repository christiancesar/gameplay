// Socket.IO rooms the gateway uses. Each socket joins its user's room on
// connect, so a user is reached on every tab; server rooms follow
// server:subscribe; voice rooms hold the socket that has the seat, so it keeps
// hearing about its room while another server is open.
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

export function voiceRoom(roomId: string): string {
  return `voice:${roomId}`
}

// Every socket of one login session, to close just those.
export function sessionRoom(sessionId: string): string {
  return `session:${sessionId}`
}
