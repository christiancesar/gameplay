import { Module } from '@nestjs/common'
import { HealthController } from './controllers/health.controller'
import { CheckHealthUseCase } from './use-cases/check-health.use-case'

@Module({
  controllers: [HealthController],
  providers: [CheckHealthUseCase],
})
export class HealthModule {}
