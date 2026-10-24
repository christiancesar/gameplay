import { Module } from '@nestjs/common'
import { EnvModule } from './env/env.module'
import { LoggerModule } from './lib/logger'
import { PrismaModule } from './lib/prisma'
import { HealthModule } from './modules/health/health.module'

@Module({
  imports: [EnvModule, LoggerModule, PrismaModule, HealthModule],
})
export class AppModule {}
