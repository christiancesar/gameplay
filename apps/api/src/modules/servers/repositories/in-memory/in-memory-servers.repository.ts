import type { ServerRole } from '@gameplay/contracts'
import type { RoomRecord, ServerRecord, ServerWithRole } from '../../domain/server'
import { type CreateServerData, type ServerChanges, ServersRepository } from '../servers.repository'
import type { InMemoryRoomsRepository } from './in-memory-rooms.repository'

type Member = { serverId: string; userId: string; role: ServerRole; joinedAt: Date }

export class InMemoryServersRepository extends ServersRepository {
  readonly servers = new Map<string, ServerRecord>()
  readonly members: Member[] = []
  // Test helper: pending join requests per server (the requests themselves
  // live in the memberships module).
  readonly pendingJoinRequests = new Map<string, number>()
  private sequence = 0

  constructor(private readonly rooms: InMemoryRoomsRepository) {
    super()
  }

  // Test helper: adds a member straight away.
  addMember(serverId: string, userId: string, role: ServerRole) {
    this.members.push({ serverId, userId, role, joinedAt: new Date(Date.now() + this.members.length) })
  }

  async createWithOwner(
    { name, description, ownerId, roomName }: CreateServerData,
    guard: (ownedCount: number) => void,
  ): Promise<{ server: ServerRecord; room: RoomRecord }> {
    guard([...this.servers.values()].filter((server) => server.ownerId === ownerId).length)
    this.sequence += 1
    const server: ServerRecord = {
      id: `server-${this.sequence}`,
      name,
      description,
      iconKey: null,
      coverKey: null,
      autoApprove: false,
      ownerId,
      createdAt: new Date(),
    }
    this.servers.set(server.id, server)
    this.addMember(server.id, ownerId, 'owner')
    const room = this.rooms.insert(server.id, roomName)
    return { server: { ...server }, room }
  }

  async findById(serverId: string): Promise<ServerRecord | null> {
    const server = this.servers.get(serverId)
    return server ? { ...server } : null
  }

  async findRole(serverId: string, userId: string): Promise<ServerWithRole | null> {
    const server = this.servers.get(serverId)
    const member = this.members.find((m) => m.serverId === serverId && m.userId === userId)
    return server && member ? { server: { ...server }, role: member.role } : null
  }

  async listForUser(userId: string): Promise<ServerWithRole[]> {
    return this.members
      .filter((member) => member.userId === userId && this.servers.has(member.serverId))
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
      .map((member) => ({ server: { ...this.servers.get(member.serverId)! }, role: member.role }))
  }

  async update(serverId: string, changes: ServerChanges): Promise<ServerRecord> {
    const server = { ...this.servers.get(serverId)!, ...changes }
    this.servers.set(serverId, server)
    return { ...server }
  }

  async countMembers(serverId: string): Promise<number> {
    return this.members.filter((member) => member.serverId === serverId).length
  }

  async countOwned(userId: string): Promise<number> {
    return [...this.servers.values()].filter((server) => server.ownerId === userId).length
  }

  async countPendingJoinRequests(serverId: string): Promise<number> {
    return this.pendingJoinRequests.get(serverId) ?? 0
  }

  async listMemberIds(serverId: string): Promise<string[]> {
    return this.members.filter((member) => member.serverId === serverId).map((member) => member.userId)
  }

  async delete(serverId: string): Promise<void> {
    this.servers.delete(serverId)
    for (let i = this.members.length - 1; i >= 0; i--) {
      if (this.members[i].serverId === serverId) this.members.splice(i, 1)
    }
    this.rooms.removeServer(serverId)
  }
}
