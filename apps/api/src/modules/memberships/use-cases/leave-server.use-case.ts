import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ServerPermissions } from '../../servers/domain/server-permissions'
import { ServerAccessService } from '../../servers/services/server-access.service'
import { OwnerCannotLeaveError } from '../errors/memberships.errors'
import { MembershipsRepository } from '../repositories/memberships.repository'

// Admin and member leave; the owner only by deleting the server.
@Injectable()
export class LeaveServerUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly access: ServerAccessService,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId }: { serverId: string; userId: string }): Promise<void> {
    const { role } = await this.access.member(serverId, userId)
    if (!ServerPermissions.can(role, 'leaveServer')) throw new OwnerCannotLeaveError()
    await this.memberships.withServerLock(serverId, (store) => store.removeMember(serverId, userId))
    await this.events.publish('membership.removed', { serverId, userId, reason: 'leave' })
  }
}
