import { Body, Controller, HttpCode, HttpStatus, Param, Put } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import { ServerLimitsDto } from '../dtos/platform-settings.dto'
import { SetServerLimitOverrideUseCase } from '../use-cases/set-server-limit-override.use-case'

@ApiTags('admin: settings')
@PlatformAdmin()
@Controller('admin/servers/:serverId/limits')
export class ServerLimitsController {
  constructor(private readonly setOverride: SetServerLimitOverrideUseCase) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async set(@Param('serverId') serverId: string, @Body() body: ServerLimitsDto): Promise<void> {
    await this.setOverride.execute({ serverId, limits: body })
  }
}
