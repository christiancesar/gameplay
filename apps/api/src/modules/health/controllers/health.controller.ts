import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { CheckHealthUseCase, type HealthReport } from '../use-cases/check-health.use-case'

@Controller('health')
export class HealthController {
  constructor(private readonly checkHealth: CheckHealthUseCase) {}

  @Get()
  async handle(): Promise<HealthReport> {
    const report = await this.checkHealth.execute()
    if (report.status !== 'ok') throw new ServiceUnavailableException(report)
    return report
  }
}
