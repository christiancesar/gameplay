import { Injectable } from '@nestjs/common'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { ServerAccessService } from '../../servers/services/server-access.service'
import { type InviteListItem, SERVER_INVITE_TTL_MS } from '../domain/membership'
import { MemberLimitReachedError } from '../errors/memberships.errors'
import { InviteCodeGenerator } from '../providers/invite-code-generator/invite-code-generator.provider'
import { MembershipsRepository } from '../repositories/memberships.repository'

type Input = { serverId: string; userId: string }

// One invite per person, valid for 1 hour. Blocked while the server is full.
@Injectable()
export class CreateServerInviteUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccessService,
    private readonly limits: EffectiveLimitsService,
    private readonly codes: InviteCodeGenerator,
  ) {}

  async execute({ serverId, userId }: Input): Promise<InviteListItem> {
    await this.access.require(serverId, userId, 'manageInvites')
    const limit = await this.limits.resolve({ kind: 'membersPerServer', serverId })
    return this.memberships.withServerLock(serverId, async (store) => {
      if ((await store.countMembers(serverId)) >= limit) throw new MemberLimitReachedError(limit)
      return store.createInvite({
        serverId,
        code: this.codes.generate(),
        createdById: userId,
        expiresAt: new Date(Date.now() + SERVER_INVITE_TTL_MS),
      })
    })
  }
}
