import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ServerAccess } from '../../servers/services/server-access'
import { MembershipsRepository } from '../repositories/memberships.repository'
import { targetRole } from '../domain/act-on-member'

type Input = { serverId: string; userId: string; targetId: string }

// The only moderation (no ban): frees the slot, and the person may come back
// with a new invite.
@Injectable()
export class KickMemberUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccess,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, targetId }: Input): Promise<void> {
    const { role } = await this.access.member(serverId, userId)
    await this.memberships.withServerLock(serverId, async (store) => {
      await targetRole(store, { serverId, actorRole: role, actorId: userId, targetId }, 'kick')
      await store.removeMember(serverId, targetId)
    })
    await this.events.publish('membership.removed', { serverId, userId: targetId, reason: 'kick' })
  }
}
