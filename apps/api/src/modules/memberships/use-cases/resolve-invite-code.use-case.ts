import { Injectable } from '@nestjs/common'
import type { ResolvedInvite } from '@gameplay/contracts'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { ServersRepository } from '../../servers/repositories/servers.repository'
import { ServerViewsService } from '../../servers/services/server-views.service'
import { serverInviteStatus } from '../domain/membership'
import { MembershipsRepository } from '../repositories/memberships.repository'

type Input = { code: string; userId: string | null }

const NOT_FOUND: ResolvedInvite = { status: 'not-found', server: null, alreadyMember: false }

// For the invite landing, with or without a session: server name, icon and
// size, and what happened to the invite.
@Injectable()
export class ResolveInviteCodeUseCase {
  constructor(
    private readonly memberships: MembershipsRepository,
    private readonly servers: ServersRepository,
    private readonly views: ServerViewsService,
    private readonly limits: EffectiveLimitsService,
  ) {}

  async execute({ code, userId }: Input): Promise<ResolvedInvite> {
    const invite = await this.memberships.findInviteByCode(code)
    const server = invite && (await this.servers.findById(invite.serverId))
    if (!invite || !server) return NOT_FOUND

    const [memberCount, limit, role] = await Promise.all([
      this.servers.countMembers(server.id),
      this.limits.resolve({ kind: 'membersPerServer', serverId: server.id }),
      userId ? this.servers.findRole(server.id, userId) : null,
    ])
    return {
      status: serverInviteStatus(invite, new Date()),
      server: {
        id: server.id,
        name: server.name,
        iconUrl: this.views.url(server.iconKey),
        memberCount,
        full: memberCount >= limit,
      },
      alreadyMember: role !== null,
    }
  }
}
