import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ServerAccess } from '../../servers/services/server-access'
import { MembershipsRepository } from '../repositories/memberships.repository'
import { pendingRequest } from '../domain/decide-join-request'

type Input = { serverId: string; userId: string; requestId: string }

// The invite stays used: the person needs a new one to ask again.
@Injectable()
export class DeclineJoinRequestUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccess,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, requestId }: Input): Promise<void> {
    await this.access.require(serverId, userId, 'decideJoinRequests')
    const request = await this.memberships.withServerLock(serverId, async (store) => {
      const pending = await pendingRequest(store, serverId, requestId)
      await store.decideRequest(requestId, 'declined', userId, new Date())
      return pending
    })
    await this.events.publish('membership.declined', { serverId, userId: request.userId, declinedById: userId })
  }
}
