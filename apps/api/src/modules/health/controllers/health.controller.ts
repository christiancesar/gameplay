import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import type { Response } from 'express'
import { ZodResponse } from 'nestjs-zod'
import { type HealthDetails, HealthDetailsDto } from '../dtos/health-details.dto'
import { type HealthReport, HealthReportDto } from '../dtos/health-report.dto'
import { CheckHealthDetailsUseCase } from '../use-cases/check-health-details.use-case'
import { CheckHealthUseCase } from '../use-cases/check-health.use-case'

@ApiTags('health')
@SkipThrottle()
@AllowAnonymous()
@Controller('health')
export class HealthController {
  constructor(
    private readonly checkHealth: CheckHealthUseCase,
    private readonly checkHealthDetails: CheckHealthDetailsUseCase,
  ) {}

  // A failing check is a report, not an error: same body, status 503.
  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: HealthReportDto })
  @ApiServiceUnavailableResponse({ type: HealthReportDto.Output })
  async handle(@Res({ passthrough: true }) res: Response): Promise<HealthReport> {
    const report = await this.checkHealth.execute()
    if (report.status !== 'ok') res.status(HttpStatus.SERVICE_UNAVAILABLE)
    return report
  }

  // 503 only on an outage; a degraded app still answers 200.
  @Get('details')
  @ZodResponse({ status: HttpStatus.OK, type: HealthDetailsDto })
  @ApiServiceUnavailableResponse({ type: HealthDetailsDto.Output })
  async details(@Res({ passthrough: true }) res: Response): Promise<HealthDetails> {
    const report = await this.checkHealthDetails.execute()
    if (report.status === 'outage') res.status(HttpStatus.SERVICE_UNAVAILABLE)
    return report
  }
}
