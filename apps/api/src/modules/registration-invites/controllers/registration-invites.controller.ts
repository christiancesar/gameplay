import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type { GenerateRegistrationInviteResponse, ListRegistrationInvitesResponse } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import type { AuthUser } from '../../../lib/auth'
import {
  GenerateRegistrationInviteRequestDto,
  GenerateRegistrationInviteResponseDto,
  ListRegistrationInvitesResponseDto,
  toRegistrationInviteDto,
} from '../dtos/registration-invite.dto'
import { GenerateRegistrationInviteUseCase } from '../use-cases/generate-registration-invite.use-case'
import { ListRegistrationInvitesUseCase } from '../use-cases/list-registration-invites.use-case'
import { RevokeRegistrationInviteUseCase } from '../use-cases/revoke-registration-invite.use-case'

@ApiTags('admin: registration invites')
@PlatformAdmin()
@Controller('admin/registration-invites')
export class RegistrationInvitesController {
  constructor(
    private readonly generateInvite: GenerateRegistrationInviteUseCase,
    private readonly listInvites: ListRegistrationInvitesUseCase,
    private readonly revokeInvite: RevokeRegistrationInviteUseCase,
  ) {}

  // The response carries the full key; it can't be read again later.
  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: GenerateRegistrationInviteResponseDto })
  async generate(
    @Body() body: GenerateRegistrationInviteRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<GenerateRegistrationInviteResponse> {
    const { key, invite } = await this.generateInvite.execute({ validity: body.validity, createdById: user.id })
    return { key, invite: toRegistrationInviteDto(invite) }
  }

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ListRegistrationInvitesResponseDto })
  async list(): Promise<ListRegistrationInvitesResponse> {
    const now = new Date()
    const invites = await this.listInvites.execute()
    return { invites: invites.map((invite) => toRegistrationInviteDto(invite, now)) }
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async revoke(@Param('id') id: string): Promise<void> {
    await this.revokeInvite.execute(id)
  }
}
