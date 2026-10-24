import { Module } from '@nestjs/common'
import { CommonModule } from './common/common.module'
import { EnvModule } from './env/env.module'
import { LoggerModule } from './lib/logger'
import { PrismaModule } from './lib/prisma'
import { AuthenticationModule } from './modules/auth/authentication.module'
import { HealthModule } from './modules/health/health.module'

@Module({
  imports: [EnvModule, LoggerModule, PrismaModule, CommonModule, AuthenticationModule, HealthModule],
})
export class AppModule {}
