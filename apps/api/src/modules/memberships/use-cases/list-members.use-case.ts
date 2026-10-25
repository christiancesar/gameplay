import { Injectable } from '@nestjs/common'
import { ServerAccessService } from '../../servers/services/server-access.service'
import type { MemberListItem } from '../domain/membership'
import { MembershipsRepository } from '../repositories/memberships.repository'

// Any member sees the list, with how each one joined.
@Injectable()
export class ListMembersUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccessService,
  ) {}

  async execute({ serverId, userId }: { serverId: string; userId: string }): Promise<MemberListItem[]> {
    await this.access.member(serverId, userId)
    return this.memberships.listMembers(serverId)
  }
}
