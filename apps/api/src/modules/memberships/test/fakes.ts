import { REGISTRATION_KEY_ALPHABET } from '@gameplay/shared'
import { makeServersContext } from '../../servers/test/fakes'
import { InviteCodeGenerator } from '../providers/invite-code-generator'
import { InMemoryMembershipsRepository } from '../repositories/in-memory/in-memory-memberships.repository'
import { ApproveJoinRequestUseCase } from '../use-cases/approve-join-request.use-case'
import { CreateServerInviteUseCase } from '../use-cases/create-server-invite.use-case'
import { DeclineJoinRequestUseCase } from '../use-cases/decline-join-request.use-case'
import { DemoteToMemberUseCase } from '../use-cases/demote-to-member.use-case'
import { KickMemberUseCase } from '../use-cases/kick-member.use-case'
import { LeaveServerUseCase } from '../use-cases/leave-server.use-case'
import { ListMembersUseCase } from '../use-cases/list-members.use-case'
import { PromoteToAdminUseCase } from '../use-cases/promote-to-admin.use-case'
import { RequestToJoinUseCase } from '../use-cases/request-to-join.use-case'
import { ResolveInviteCodeUseCase } from '../use-cases/resolve-invite-code.use-case'
import { RevokeServerInviteUseCase } from '../use-cases/revoke-server-invite.use-case'
import { CreateServerUseCase } from '../../servers/use-cases/create-server.use-case'

// GAMEPL32, GAMEPL42...: valid codes, a new one each call.
export class SequentialCodes extends InviteCodeGenerator {
  private count = 0

  generate(): string {
    this.count += 1
    return `GAMEPL${REGISTRATION_KEY_ALPHABET[this.count]}${REGISTRATION_KEY_ALPHABET[0]}`
  }
}

// A server owned by "owner" with an admin and a member, plus every
// membership use-case wired to in-memory fakes.
export async function makeMembershipsContext() {
  const ctx = makeServersContext()
  const memberships = new InMemoryMembershipsRepository(ctx.servers)
  const server = await new CreateServerUseCase(ctx.servers, ctx.limits, ctx.views).execute({
    userId: 'owner',
    name: 'Squad',
  })
  ctx.servers.addMember(server.id, 'admin', 'admin')
  ctx.servers.addMember(server.id, 'member', 'member')
  const { access, limits, events, servers, views } = ctx
  return {
    ...ctx,
    memberships,
    serverId: server.id,
    createInvite: new CreateServerInviteUseCase(memberships, access, limits, new SequentialCodes()),
    revokeInvite: new RevokeServerInviteUseCase(memberships, access),
    resolve: new ResolveInviteCodeUseCase(memberships, servers, views, limits),
    join: new RequestToJoinUseCase(memberships, servers, limits, events),
    approve: new ApproveJoinRequestUseCase(memberships, access, limits, events),
    decline: new DeclineJoinRequestUseCase(memberships, access, events),
    listMembers: new ListMembersUseCase(memberships, access),
    kick: new KickMemberUseCase(memberships, access, events),
    promote: new PromoteToAdminUseCase(memberships, access, events),
    demote: new DemoteToMemberUseCase(memberships, access, events),
    leave: new LeaveServerUseCase(memberships, access, events),
  }
}
