import { Injectable } from '@nestjs/common'
import type { JoinServerResponse } from '@gameplay/shared'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { ServersRepository } from '../../servers/repositories/servers.repository'
import { serverInviteStatus } from '../domain/membership'
import {
  JoinRequestPendingError,
  ServerInviteExpiredError,
  ServerInviteNotFoundError,
  ServerInviteRevokedError,
  ServerInviteUsedError,
} from '../errors/memberships.errors'
import { MembershipsRepository } from '../repositories/memberships.repository'

type Input = { code: string; userId: string }

const INVITE_ERRORS = {
  expired: ServerInviteExpiredError,
  used: ServerInviteUsedError,
  revoked: ServerInviteRevokedError,
} as const

// Consumes the invite and creates the join request in one transaction. With
// auto-approve on and a free slot the user joins right away; otherwise the
// request waits (also with auto-approve, when the server is full).
@Injectable()
export class RequestToJoinUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly servers: ServersRepository,
    private readonly limits: EffectiveLimitsService,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ code, userId }: Input): Promise<JoinServerResponse> {
    const found = await this.memberships.findInviteByCode(code)
    const server = found && (await this.servers.findById(found.serverId))
    if (!found || !server) throw new ServerInviteNotFoundError()
    const serverId = server.id
    const limit = await this.limits.resolve({ kind: 'membersPerServer', serverId })

    const outcome = await this.memberships.withServerLock(serverId, async (store) => {
      // A member just opens the server; the invite stays for someone else.
      if (await store.findRole(serverId, userId)) return { result: 'already-member' as const }
      if (await store.hasPendingRequest(serverId, userId)) throw new JoinRequestPendingError()

      const invite = (await store.findInvite(found.id))!
      const now = new Date()
      const status = serverInviteStatus(invite, now)
      if (status !== 'active') throw new INVITE_ERRORS[status]()
      await store.markInviteUsed(invite.id, userId, now)

      const joins = server.autoApprove && (await store.countMembers(serverId)) < limit
      const request = await store.createRequest({
        serverId,
        userId,
        inviteId: invite.id,
        status: joins ? 'approved' : 'pending',
        decidedById: null,
        decidedAt: joins ? now : null,
      })
      if (joins) await store.addMember({ serverId, userId, role: 'member', inviteId: invite.id })
      return { result: joins ? ('joined' as const) : ('pending' as const), requestId: request.id }
    })

    if (outcome.result === 'joined') {
      await this.events.publish('membership.approved', { serverId, userId, approvedById: null })
    } else if (outcome.result === 'pending') {
      await this.events.publish('membership.join-requested', { serverId, userId, requestId: outcome.requestId })
    }
    return { serverId, result: outcome.result }
  }
}
