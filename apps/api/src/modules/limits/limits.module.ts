import { Module } from '@nestjs/common'
import { PlatformSettingsController } from './controllers/platform-settings.controller'
import { PublicSettingsController } from './controllers/public-settings.controller'
import { ServerLimitsController } from './controllers/server-limits.controller'
import { UserLimitsController } from './controllers/user-limits.controller'
import { PlatformSettingsRepository } from './repositories/platform-settings.repository'
import { PrismaPlatformSettingsRepository } from './repositories/prisma/prisma-platform-settings.repository'
import { PrismaServerLimitsRepository } from './repositories/prisma/prisma-server-limits.repository'
import { PrismaUserLimitsRepository } from './repositories/prisma/prisma-user-limits.repository'
import { ServerLimitsRepository } from './repositories/server-limits.repository'
import { UserLimitsRepository } from './repositories/user-limits.repository'
import { GetPlatformSettingsUseCase } from './use-cases/get-platform-settings.use-case'
import { EffectiveLimitsService } from './services/effective-limits.service'
import { SetServerLimitOverrideUseCase } from './use-cases/set-server-limit-override.use-case'
import { SetUserLimitOverrideUseCase } from './use-cases/set-user-limit-override.use-case'
import { UpdatePlatformSettingsUseCase } from './use-cases/update-platform-settings.use-case'

// Platform defaults, per-user overrides and the effective-limit resolver used
// by the modules that create servers, invites and rooms.
@Module({
  controllers: [PlatformSettingsController, UserLimitsController, ServerLimitsController, PublicSettingsController],
  providers: [
    { provide: PlatformSettingsRepository, useClass: PrismaPlatformSettingsRepository },
    { provide: UserLimitsRepository, useClass: PrismaUserLimitsRepository },
    { provide: ServerLimitsRepository, useClass: PrismaServerLimitsRepository },
    GetPlatformSettingsUseCase,
    UpdatePlatformSettingsUseCase,
    SetUserLimitOverrideUseCase,
    SetServerLimitOverrideUseCase,
    EffectiveLimitsService,
  ],
  exports: [EffectiveLimitsService, GetPlatformSettingsUseCase],
})
export class LimitsModule {}
