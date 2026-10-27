import { Module } from '@nestjs/common'
import { PlatformSettingsController } from './controllers/platform-settings.controller'
import { PublicSettingsController } from './controllers/public-settings.controller'
import { ServerLimitsController } from './controllers/server-limits.controller'
import { UserLimitsController } from './controllers/user-limits.controller'
import { MediaSettingsRepository } from './repositories/media-settings.repository'
import { PlatformSettingsRepository } from './repositories/platform-settings.repository'
import { PrismaMediaSettingsRepository } from './repositories/prisma/prisma-media-settings.repository'
import { PrismaPlatformSettingsRepository } from './repositories/prisma/prisma-platform-settings.repository'
import { PrismaServerLimitsRepository } from './repositories/prisma/prisma-server-limits.repository'
import { PrismaUserLimitsRepository } from './repositories/prisma/prisma-user-limits.repository'
import { ServerLimitsRepository } from './repositories/server-limits.repository'
import { UserLimitsRepository } from './repositories/user-limits.repository'
import { GetPlatformSettingsUseCase } from './use-cases/get-platform-settings.use-case'
import { EffectiveLimitsService } from './services/effective-limits.service'
import { EffectiveMediaService } from './services/effective-media.service'
import { SetServerLimitOverrideUseCase } from './use-cases/set-server-limit-override.use-case'
import { SetUserLimitOverrideUseCase } from './use-cases/set-user-limit-override.use-case'
import { UpdatePlatformSettingsUseCase } from './use-cases/update-platform-settings.use-case'

// Platform defaults, per-user overrides and the effective-limit resolver used
// by the modules that create servers, invites and rooms. Also the media
// resources (SFU, mesh, TURN), global and per server.
@Module({
  controllers: [PlatformSettingsController, UserLimitsController, ServerLimitsController, PublicSettingsController],
  providers: [
    { provide: PlatformSettingsRepository, useClass: PrismaPlatformSettingsRepository },
    { provide: UserLimitsRepository, useClass: PrismaUserLimitsRepository },
    { provide: ServerLimitsRepository, useClass: PrismaServerLimitsRepository },
    { provide: MediaSettingsRepository, useClass: PrismaMediaSettingsRepository },
    GetPlatformSettingsUseCase,
    UpdatePlatformSettingsUseCase,
    SetUserLimitOverrideUseCase,
    SetServerLimitOverrideUseCase,
    EffectiveLimitsService,
    EffectiveMediaService,
  ],
  exports: [EffectiveLimitsService, EffectiveMediaService, MediaSettingsRepository, GetPlatformSettingsUseCase],
})
export class LimitsModule {}
