import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ServerAccess } from '../../servers/services/server-access'
import { MembershipsRepository } from '../repositories/memberships.repository'
import { targetRole } from '../domain/act-on-member'

type Input = { serverId: string; userId: string; targetId: string }

// A member becomes admin.
@Injectable()
export class PromoteToAdminUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccess,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, targetId }: Input): Promise<void> {
    const { role } = await this.access.member(serverId, userId)
    await this.memberships.withServerLock(serverId, async (store) => {
      await targetRole(store, { serverId, actorRole: role, actorId: userId, targetId }, 'promote')
      await store.setRole(serverId, targetId, 'admin')
    })
    await this.events.publish('membership.role-changed', { serverId, userId: targetId, role: 'admin' })
  }
}
