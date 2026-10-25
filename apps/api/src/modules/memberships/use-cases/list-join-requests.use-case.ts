import { Injectable } from '@nestjs/common'
import { ServerAccessService } from '../../servers/services/server-access.service'
import type { JoinRequestListItem } from '../domain/membership'
import { MembershipsRepository } from '../repositories/memberships.repository'

@Injectable()
export class ListJoinRequestsUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccessService,
  ) {}

  async execute({ serverId, userId }: { serverId: string; userId: string }): Promise<JoinRequestListItem[]> {
    await this.access.require(serverId, userId, 'decideJoinRequests')
    return this.memberships.listPendingRequests(serverId)
  }
}
