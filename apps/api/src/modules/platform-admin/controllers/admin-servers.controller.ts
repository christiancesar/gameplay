import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { AdminServerDetail, ListAdminServersResponse } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import {
  AdminListQueryDto,
  AdminServerDetailDto,
  ListAdminServersResponseDto,
  toAdminServerDetailDto,
  toAdminServerDto,
} from '../dtos/platform-admin.dto'
import { AdminDeleteServerUseCase } from '../use-cases/admin-delete-server.use-case'
import { GetServerDetailUseCase } from '../use-cases/get-server-detail.use-case'
import { ListServersUseCase } from '../use-cases/list-servers.use-case'

@ApiTags('admin: servers')
@PlatformAdmin()
@Controller('admin/servers')
export class AdminServersController {
  constructor(
    private readonly listServers: ListServersUseCase,
    private readonly getDetail: GetServerDetailUseCase,
    private readonly deleteServer: AdminDeleteServerUseCase,
  ) {}

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ListAdminServersResponseDto })
  async list(@Query() query: AdminListQueryDto): Promise<ListAdminServersResponse> {
    const { page, pageSize } = query
    const { items, total } = await this.listServers.execute(query)
    return { servers: items.map(toAdminServerDto), total, page, pageSize }
  }

  @Get(':serverId')
  @ZodResponse({ status: HttpStatus.OK, type: AdminServerDetailDto })
  async detail(@Param('serverId') serverId: string): Promise<AdminServerDetail> {
    return toAdminServerDetailDto(await this.getDetail.execute(serverId))
  }

  @Delete(':serverId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('serverId') serverId: string): Promise<void> {
    await this.deleteServer.execute(serverId)
  }
}
