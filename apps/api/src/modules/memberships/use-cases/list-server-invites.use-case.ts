import { Injectable } from '@nestjs/common'
import { ServerAccessService } from '../../servers/services/server-access.service'
import type { InviteListItem } from '../domain/membership'
import { MembershipsRepository } from '../repositories/memberships.repository'

// Every invite stays as a record; the status is computed when listing.
@Injectable()
export class ListServerInvitesUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccessService,
  ) {}

  async execute({ serverId, userId }: { serverId: string; userId: string }): Promise<InviteListItem[]> {
    await this.access.require(serverId, userId, 'manageInvites')
    return this.memberships.listInvites(serverId)
  }
}
