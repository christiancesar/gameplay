import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ServerAccessService } from '../../servers/services/server-access.service'
import { MembershipsRepository } from '../repositories/memberships.repository'
import { targetRole } from '../domain/act-on-member'

type Input = { serverId: string; userId: string; targetId: string }

// An admin goes back to member. The owner can't be demoted.
@Injectable()
export class DemoteToMemberUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccessService,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, targetId }: Input): Promise<void> {
    const { role } = await this.access.member(serverId, userId)
    await this.memberships.withServerLock(serverId, async (store) => {
      await targetRole(store, { serverId, actorRole: role, actorId: userId, targetId }, 'demote')
      await store.setRole(serverId, targetId, 'member')
    })
    await this.events.publish('membership.role-changed', { serverId, userId: targetId, role: 'member' })
  }
}
