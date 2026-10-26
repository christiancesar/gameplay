import { Module } from '@nestjs/common'
import { IceModule } from '../ice/ice.module'
import { HealthController } from './controllers/health.controller'
import { CheckHealthDetailsUseCase } from './use-cases/check-health-details.use-case'
import { CheckHealthUseCase } from './use-cases/check-health.use-case'

@Module({
  imports: [IceModule],
  controllers: [HealthController],
  providers: [CheckHealthUseCase, CheckHealthDetailsUseCase],
})
export class HealthModule {}
