import { Controller, Get, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { PublicSettings } from '@gameplay/contracts'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { ZodResponse } from 'nestjs-zod'
import { PublicSettingsDto } from '../dtos/platform-settings.dto'
import { GetPlatformSettingsUseCase } from '../use-cases/get-platform-settings.use-case'

// Read before sign-in, for the outdated-browser alert.
@ApiTags('settings')
@AllowAnonymous()
@Controller('settings/public')
export class PublicSettingsController {
  constructor(private readonly getSettings: GetPlatformSettingsUseCase) {}

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: PublicSettingsDto })
  async get(): Promise<PublicSettings> {
    const { minChromiumVersion } = await this.getSettings.execute()
    return { minChromiumVersion }
  }
}
