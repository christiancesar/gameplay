import { Injectable } from '@nestjs/common'
import { ServerAccessService } from '../../servers/services/server-access.service'
import { ServerInviteNotFoundError, ServerInviteUsedError } from '../errors/memberships.errors'
import { MembershipsRepository } from '../repositories/memberships.repository'

type Input = { serverId: string; userId: string; inviteId: string }

// Revoking again, or an expired invite, is not an error. A used one can't be
// revoked: it already became a join request.
@Injectable()
export class RevokeServerInviteUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccessService,
  ) {}

  async execute({ serverId, userId, inviteId }: Input): Promise<void> {
    await this.access.require(serverId, userId, 'manageInvites')
    await this.memberships.withServerLock(serverId, async (store) => {
      const invite = await store.findInvite(inviteId)
      if (!invite || invite.serverId !== serverId) throw new ServerInviteNotFoundError()
      if (invite.usedAt) throw new ServerInviteUsedError()
      await store.revokeInvite(inviteId, new Date())
    })
  }
}
