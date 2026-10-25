import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ResolveEffectiveLimitUseCase } from '../../limits/use-cases/resolve-effective-limit.use-case'
import { ServerAccess } from '../../servers/services/server-access'
import { MemberLimitReachedError } from '../errors/memberships.errors'
import { MembershipsRepository } from '../repositories/memberships.repository'
import { pendingRequest } from '../domain/decide-join-request'

type Input = { serverId: string; userId: string; requestId: string }

// Blocked at the member limit; the request keeps waiting.
@Injectable()
export class ApproveJoinRequestUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccess,
    private readonly limits: ResolveEffectiveLimitUseCase,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, requestId }: Input): Promise<void> {
    await this.access.require(serverId, userId, 'decideJoinRequests')
    const limit = await this.limits.execute({ kind: 'membersPerServer', serverId })
    const request = await this.memberships.withServerLock(serverId, async (store) => {
      const pending = await pendingRequest(store, serverId, requestId)
      if ((await store.countMembers(serverId)) >= limit) throw new MemberLimitReachedError(limit)
      await store.addMember({ serverId, userId: pending.userId, role: 'member', inviteId: pending.inviteId })
      await store.decideRequest(requestId, 'approved', userId, new Date())
      return pending
    })
    await this.events.publish('membership.approved', { serverId, userId: request.userId, approvedById: userId })
  }
}
