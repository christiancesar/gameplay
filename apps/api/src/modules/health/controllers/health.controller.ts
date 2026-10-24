import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import type { Response } from 'express'
import { ZodResponse } from 'nestjs-zod'
import { type HealthReport, HealthReportDto } from '../dtos/health-report.dto'
import { CheckHealthUseCase } from '../use-cases/check-health.use-case'

@ApiTags('health')
@SkipThrottle()
@AllowAnonymous()
@Controller('health')
export class HealthController {
  constructor(private readonly checkHealth: CheckHealthUseCase) {}

  // A failing check is a report, not an error: same body, status 503.
  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: HealthReportDto })
  @ApiServiceUnavailableResponse({ type: HealthReportDto.Output })
  async handle(@Res({ passthrough: true }) res: Response): Promise<HealthReport> {
    const report = await this.checkHealth.execute()
    if (report.status !== 'ok') res.status(HttpStatus.SERVICE_UNAVAILABLE)
    return report
  }
}
