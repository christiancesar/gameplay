import { Module } from '@nestjs/common'
import { LimitsModule } from '../limits/limits.module'
import { ServersModule } from '../servers/servers.module'
import { InviteCodesController } from './controllers/invite-codes.controller'
import { JoinRequestsController } from './controllers/join-requests.controller'
import { MembersController } from './controllers/members.controller'
import { ServerInvitesController } from './controllers/server-invites.controller'
import { CryptoInviteCodeGenerator, InviteCodeGenerator } from './providers/invite-code-generator'
import { MembershipsRepository } from './repositories/memberships.repository'
import { PrismaMembershipsRepository } from './repositories/prisma/prisma-memberships.repository'
import { ApproveJoinRequestUseCase } from './use-cases/approve-join-request.use-case'
import { CreateServerInviteUseCase } from './use-cases/create-server-invite.use-case'
import { DeclineJoinRequestUseCase } from './use-cases/decline-join-request.use-case'
import { DemoteToMemberUseCase } from './use-cases/demote-to-member.use-case'
import { KickMemberUseCase } from './use-cases/kick-member.use-case'
import { LeaveServerUseCase } from './use-cases/leave-server.use-case'
import { ListJoinRequestsUseCase } from './use-cases/list-join-requests.use-case'
import { ListMembersUseCase } from './use-cases/list-members.use-case'
import { ListServerInvitesUseCase } from './use-cases/list-server-invites.use-case'
import { PromoteToAdminUseCase } from './use-cases/promote-to-admin.use-case'
import { RequestToJoinUseCase } from './use-cases/request-to-join.use-case'
import { ResolveInviteCodeUseCase } from './use-cases/resolve-invite-code.use-case'
import { RevokeServerInviteUseCase } from './use-cases/revoke-server-invite.use-case'

// Server invites, join requests and members (kick, promote, demote, leave).
// Invites and memberships share one module: joining consumes the invite and
// creates the request in the same transaction.
@Module({
  imports: [LimitsModule, ServersModule],
  controllers: [ServerInvitesController, InviteCodesController, JoinRequestsController, MembersController],
  providers: [
    { provide: MembershipsRepository, useClass: PrismaMembershipsRepository },
    { provide: InviteCodeGenerator, useClass: CryptoInviteCodeGenerator },
    CreateServerInviteUseCase,
    ListServerInvitesUseCase,
    RevokeServerInviteUseCase,
    ResolveInviteCodeUseCase,
    RequestToJoinUseCase,
    ApproveJoinRequestUseCase,
    DeclineJoinRequestUseCase,
    ListJoinRequestsUseCase,
    ListMembersUseCase,
    KickMemberUseCase,
    PromoteToAdminUseCase,
    DemoteToMemberUseCase,
    LeaveServerUseCase,
  ],
  exports: [RequestToJoinUseCase, ResolveInviteCodeUseCase],
})
export class MembershipsModule {}
