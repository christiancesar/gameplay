import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type { ListMembersResponse } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { ListMembersResponseDto, toServerMemberDto } from '../dtos/membership.dto'
import { DemoteToMemberUseCase } from '../use-cases/demote-to-member.use-case'
import { KickMemberUseCase } from '../use-cases/kick-member.use-case'
import { LeaveServerUseCase } from '../use-cases/leave-server.use-case'
import { ListMembersUseCase } from '../use-cases/list-members.use-case'
import { PromoteToAdminUseCase } from '../use-cases/promote-to-admin.use-case'

@ApiTags('server members')
@Controller('servers/:serverId')
export class MembersController {
  constructor(
    private readonly listMembers: ListMembersUseCase,
    private readonly kickMember: KickMemberUseCase,
    private readonly promoteMember: PromoteToAdminUseCase,
    private readonly demoteMember: DemoteToMemberUseCase,
    private readonly leaveServer: LeaveServerUseCase,
  ) {}

  @Get('members')
  @ZodResponse({ status: HttpStatus.OK, type: ListMembersResponseDto })
  async list(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<ListMembersResponse> {
    const members = await this.listMembers.execute({ serverId, userId: user.id })
    return { members: members.map(toServerMemberDto) }
  }

  @Post('members/:targetId/kick')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async kick(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Param('targetId') targetId: string,
  ): Promise<void> {
    await this.kickMember.execute({ serverId, userId: user.id, targetId })
  }

  @Post('members/:targetId/promote')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async promote(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Param('targetId') targetId: string,
  ): Promise<void> {
    await this.promoteMember.execute({ serverId, userId: user.id, targetId })
  }

  @Post('members/:targetId/demote')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async demote(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Param('targetId') targetId: string,
  ): Promise<void> {
    await this.demoteMember.execute({ serverId, userId: user.id, targetId })
  }

  @Post('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async leave(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<void> {
    await this.leaveServer.execute({ serverId, userId: user.id })
  }
}
