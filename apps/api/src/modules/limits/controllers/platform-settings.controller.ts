import { Body, Controller, Get, HttpStatus, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { PlatformSettings } from '@gameplay/shared'
import { ZodResponse } from 'nestjs-zod'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import { PlatformSettingsDto } from '../dtos/platform-settings.dto'
import { GetPlatformSettingsUseCase } from '../use-cases/get-platform-settings.use-case'
import { UpdatePlatformSettingsUseCase } from '../use-cases/update-platform-settings.use-case'

@ApiTags('admin: settings')
@PlatformAdmin()
@Controller('admin/settings')
export class PlatformSettingsController {
  constructor(
    private readonly getSettings: GetPlatformSettingsUseCase,
    private readonly updateSettings: UpdatePlatformSettingsUseCase,
  ) {}

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: PlatformSettingsDto })
  get(): Promise<PlatformSettings> {
    return this.getSettings.execute()
  }

  @Put()
  @ZodResponse({ status: HttpStatus.OK, type: PlatformSettingsDto })
  update(@Body() body: PlatformSettingsDto): Promise<PlatformSettings> {
    return this.updateSettings.execute(body)
  }
}
