import { Body, Controller, HttpCode, HttpStatus, Param, Put } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import { UserLimitsDto } from '../dtos/platform-settings.dto'
import { SetUserLimitOverrideUseCase } from '../use-cases/set-user-limit-override.use-case'

@ApiTags('admin: settings')
@PlatformAdmin()
@Controller('admin/users/:userId/limits')
export class UserLimitsController {
  constructor(private readonly setOverride: SetUserLimitOverrideUseCase) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async set(@Param('userId') userId: string, @Body() body: UserLimitsDto): Promise<void> {
    await this.setOverride.execute({ userId, limits: body })
  }
}
