import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type { ListServerInvitesResponse, ServerInvite } from '@gameplay/shared'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { ListServerInvitesResponseDto, ServerInviteDto, toServerInviteDto } from '../dtos/membership.dto'
import { CreateServerInviteUseCase } from '../use-cases/create-server-invite.use-case'
import { ListServerInvitesUseCase } from '../use-cases/list-server-invites.use-case'
import { RevokeServerInviteUseCase } from '../use-cases/revoke-server-invite.use-case'

@ApiTags('server invites')
@Controller('servers/:serverId/invites')
export class ServerInvitesController {
  constructor(
    private readonly createInvite: CreateServerInviteUseCase,
    private readonly listInvites: ListServerInvitesUseCase,
    private readonly revokeInvite: RevokeServerInviteUseCase,
  ) {}

  // The web builds the link from the code.
  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: ServerInviteDto })
  async create(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<ServerInvite> {
    return toServerInviteDto(await this.createInvite.execute({ serverId, userId: user.id }))
  }

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ListServerInvitesResponseDto })
  async list(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<ListServerInvitesResponse> {
    const now = new Date()
    const invites = await this.listInvites.execute({ serverId, userId: user.id })
    return { invites: invites.map((invite) => toServerInviteDto(invite, now)) }
  }

  @Post(':inviteId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async revoke(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Param('inviteId') inviteId: string,
  ): Promise<void> {
    await this.revokeInvite.execute({ serverId, userId: user.id, inviteId })
  }
}
