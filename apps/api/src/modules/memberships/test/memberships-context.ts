import { makeSeededServersContext } from '../../servers/test/servers-context'
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
import { SequentialInviteCodes } from './sequential-invite-codes'

// Every membership use-case wired to in-memory fakes, over the seed server of
// the servers module (owner, admin and member).
export async function makeMembershipsContext() {
  const ctx = await makeSeededServersContext()
  const memberships = new InMemoryMembershipsRepository(ctx.servers)

  const { access, limits, events, servers, views } = ctx
  return {
    ...ctx,
    memberships,
    createInvite: new CreateServerInviteUseCase(memberships, access, limits, new SequentialInviteCodes()),
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
