import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type { ListJoinRequestsResponse } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { ListJoinRequestsResponseDto, toJoinRequestDto } from '../dtos/membership.dto'
import { ApproveJoinRequestUseCase } from '../use-cases/approve-join-request.use-case'
import { DeclineJoinRequestUseCase } from '../use-cases/decline-join-request.use-case'
import { ListJoinRequestsUseCase } from '../use-cases/list-join-requests.use-case'

@ApiTags('server members')
@Controller('servers/:serverId/join-requests')
export class JoinRequestsController {
  constructor(
    private readonly listRequests: ListJoinRequestsUseCase,
    private readonly approveRequest: ApproveJoinRequestUseCase,
    private readonly declineRequest: DeclineJoinRequestUseCase,
  ) {}

  // Pending only.
  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ListJoinRequestsResponseDto })
  async list(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<ListJoinRequestsResponse> {
    const requests = await this.listRequests.execute({ serverId, userId: user.id })
    return { requests: requests.map(toJoinRequestDto) }
  }

  @Post(':requestId/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async approve(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Param('requestId') requestId: string,
  ): Promise<void> {
    await this.approveRequest.execute({ serverId, userId: user.id, requestId })
  }

  @Post(':requestId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async decline(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Param('requestId') requestId: string,
  ): Promise<void> {
    await this.declineRequest.execute({ serverId, userId: user.id, requestId })
  }
}
