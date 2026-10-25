import type { ServerRole } from '@gameplay/contracts'

export type ServerRecord = {
  id: string
  name: string
  description: string | null
  iconKey: string | null
  coverKey: string | null
  autoApprove: boolean
  ownerId: string
  createdAt: Date
}

export type RoomRecord = {
  id: string
  serverId: string
  name: string
  position: number
}

export type ServerWithRole = { server: ServerRecord; role: ServerRole }

// Room names are unique in a server, ignoring case and outer spaces.
export function sameRoomName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
