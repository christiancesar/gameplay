import { Injectable } from '@nestjs/common'
import { ServerAccess } from '../../servers/services/server-access'
import type { MemberListItem } from '../domain/membership'
import { MembershipsRepository } from '../repositories/memberships.repository'

// Any member sees the list, with how each one joined.
@Injectable()
export class ListMembersUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccess,
  ) {}

  async execute({ serverId, userId }: { serverId: string; userId: string }): Promise<MemberListItem[]> {
    await this.access.member(serverId, userId)
    return this.memberships.listMembers(serverId)
  }
}
