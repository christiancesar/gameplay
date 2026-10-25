import type { RoomRecord, ServerRecord, ServerWithRole } from '../domain/server'

export type CreateServerData = {
  name: string
  description: string | null
  ownerId: string
  roomName: string
}

export type ServerChanges = Partial<Pick<ServerRecord, 'name' | 'description' | 'autoApprove' | 'iconKey' | 'coverKey'>>

export abstract class ServersRepository {
  // Creates the server, its OWNER member and the first room in one
  // transaction. `guard` runs inside it, with the owner's row locked, and
  // gets how many servers the owner already has; throwing aborts.
  abstract createWithOwner(
    data: CreateServerData,
    guard: (ownedCount: number) => void,
  ): Promise<{ server: ServerRecord; room: RoomRecord }>
  abstract findById(serverId: string): Promise<ServerRecord | null>
  // Role of the user in the server; null when not a member.
  abstract findRole(serverId: string, userId: string): Promise<ServerWithRole | null>
  // Oldest membership first.
  abstract listForUser(userId: string): Promise<ServerWithRole[]>
  abstract update(serverId: string, changes: ServerChanges): Promise<ServerRecord>
  abstract countMembers(serverId: string): Promise<number>
  abstract listMemberIds(serverId: string): Promise<string[]>
  // Members and rooms go in cascade.
  abstract delete(serverId: string): Promise<void>
}
