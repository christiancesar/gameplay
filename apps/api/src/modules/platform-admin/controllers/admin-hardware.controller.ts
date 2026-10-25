import { Controller, Get, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { HardwareSummary } from '@gameplay/shared'
import { ZodResponse } from 'nestjs-zod'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import { HardwareSummaryDto } from '../dtos/platform-admin.dto'
import { GetHardwareSummaryUseCase } from '../use-cases/get-hardware-summary.use-case'

@ApiTags('admin: hardware')
@PlatformAdmin()
@Controller('admin/hardware')
export class AdminHardwareController {
  constructor(private readonly getSummary: GetHardwareSummaryUseCase) {}

  @Get('summary')
  @ZodResponse({ status: HttpStatus.OK, type: HardwareSummaryDto })
  summary(): Promise<HardwareSummary> {
    return this.getSummary.execute()
  }
}
