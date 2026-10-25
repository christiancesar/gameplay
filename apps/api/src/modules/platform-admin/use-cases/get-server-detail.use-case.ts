import { Injectable } from '@nestjs/common'
import type { MemberListItem } from '../../memberships/domain/membership'
import { MembershipsRepository } from '../../memberships/repositories/memberships.repository'
import type { RoomRecord } from '../../servers/domain/server'
import { ServerNotFoundError } from '../../servers/errors/servers.errors'
import { RoomsRepository } from '../../servers/repositories/rooms.repository'
import { AdminServersRepository } from '../repositories/admin-servers.repository'
import { type AdminServerView, AdminServerViewsService } from '../services/admin-server-views.service'

export type AdminServerDetailView = AdminServerView & { rooms: RoomRecord[]; members: MemberListItem[] }

// Any server, no membership needed: rooms, and members with the invite each used.
@Injectable()
export class GetServerDetailUseCase {
  constructor(
    private readonly servers: AdminServersRepository,
    private readonly rooms: RoomsRepository,
    private readonly memberships: MembershipsRepository,
    private readonly views: AdminServerViewsService,
  ) {}

  async execute(serverId: string): Promise<AdminServerDetailView> {
    const server = await this.servers.findById(serverId)
    if (!server) throw new ServerNotFoundError()
    const [rooms, members] = await Promise.all([this.rooms.list(serverId), this.memberships.listMembers(serverId)])
    return { ...this.views.view(server), rooms, members }
  }
}
