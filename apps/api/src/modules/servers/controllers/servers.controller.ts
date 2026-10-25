import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type { ListMyServersResponse, ServerDetail } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import {
  CreateServerRequestDto,
  ListMyServersResponseDto,
  ServerDetailDto,
  SetAutoApproveRequestDto,
  UpdateServerRequestDto,
} from '../dtos/server.dto'
import { CreateServerUseCase } from '../use-cases/create-server.use-case'
import { DeleteServerUseCase } from '../use-cases/delete-server.use-case'
import { GetServerUseCase } from '../use-cases/get-server.use-case'
import { ListMyServersUseCase } from '../use-cases/list-my-servers.use-case'
import { UpdateServerUseCase } from '../use-cases/update-server.use-case'

@ApiTags('servers')
@Controller('servers')
export class ServersController {
  constructor(
    private readonly createServer: CreateServerUseCase,
    private readonly listServers: ListMyServersUseCase,
    private readonly getServer: GetServerUseCase,
    private readonly updateServer: UpdateServerUseCase,
    private readonly deleteServer: DeleteServerUseCase,
  ) {}

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: ServerDetailDto })
  create(@CurrentUser() user: AuthUser, @Body() body: CreateServerRequestDto): Promise<ServerDetail> {
    const { name, description, defaultRoomName } = body
    return this.createServer.execute({ userId: user.id, name, description, defaultRoomName })
  }

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ListMyServersResponseDto })
  async list(@CurrentUser() user: AuthUser): Promise<ListMyServersResponse> {
    return { servers: await this.listServers.execute(user.id) }
  }

  @Get(':serverId')
  @ZodResponse({ status: HttpStatus.OK, type: ServerDetailDto })
  get(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<ServerDetail> {
    return this.getServer.execute({ serverId, userId: user.id })
  }

  @Patch(':serverId')
  @ZodResponse({ status: HttpStatus.OK, type: ServerDetailDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Body() body: UpdateServerRequestDto,
  ): Promise<ServerDetail> {
    return this.updateServer.execute({ serverId, userId: user.id, changes: body })
  }

  @Put(':serverId/auto-approve')
  @ZodResponse({ status: HttpStatus.OK, type: ServerDetailDto })
  setAutoApprove(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Body() body: SetAutoApproveRequestDto,
  ): Promise<ServerDetail> {
    return this.updateServer.execute({ serverId, userId: user.id, changes: { autoApprove: body.autoApprove } })
  }

  // Owner only. The web asks to type the server name before calling.
  @Delete(':serverId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async delete(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<void> {
    await this.deleteServer.execute({ serverId, userId: user.id })
  }
}
