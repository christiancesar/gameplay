import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger'
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

  // Liveness only: always 200 while the process answers, no database access.
  @Get()
  @ApiOperation({
    summary: 'Process liveness',
    description: 'For Docker healthchecks and deploys. Does not query the database; use /api/health/details for that.',
  })
  @ZodResponse({ status: HttpStatus.OK, type: HealthReportDto })
  handle(): HealthReport {
    return this.checkHealth.execute()
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
