import { Module } from '@nestjs/common'
import { CommonModule } from './common/common.module'
import { EnvModule } from './env/env.module'
import { LoggerModule } from './lib/logger'
import { PrismaModule } from './lib/prisma'
import { AuthenticationModule } from './modules/auth/authentication.module'
import { HealthModule } from './modules/health/health.module'
import { LimitsModule } from './modules/limits/limits.module'
import { RegistrationInvitesModule } from './modules/registration-invites/registration-invites.module'

@Module({
  imports: [
    EnvModule,
    LoggerModule,
    PrismaModule,
    CommonModule,
    AuthenticationModule,
    HealthModule,
    LimitsModule,
    RegistrationInvitesModule,
  ],
})
export class AppModule {}
