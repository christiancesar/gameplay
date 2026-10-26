import { Controller, Get, HttpStatus, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { HardwareSummary, ListAdminDevicesResponse } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import {
  AdminListQueryDto,
  HardwareSummaryDto,
  ListAdminDevicesResponseDto,
  toAdminDeviceDto,
} from '../dtos/platform-admin.dto'
import { GetHardwareSummaryUseCase } from '../use-cases/get-hardware-summary.use-case'
import { ListDevicesUseCase } from '../use-cases/list-devices.use-case'

@ApiTags('admin: hardware')
@PlatformAdmin()
@Controller('admin/hardware')
export class AdminHardwareController {
  constructor(
    private readonly getSummary: GetHardwareSummaryUseCase,
    private readonly listDevices: ListDevicesUseCase,
  ) {}

  @Get('summary')
  @ZodResponse({ status: HttpStatus.OK, type: HardwareSummaryDto })
  summary(): Promise<HardwareSummary> {
    return this.getSummary.execute()
  }

  // Search matches the username of the device's user.
  @Get('devices')
  @ZodResponse({ status: HttpStatus.OK, type: ListAdminDevicesResponseDto })
  async devices(@Query() query: AdminListQueryDto): Promise<ListAdminDevicesResponse> {
    const { page, pageSize } = query
    const { items, total } = await this.listDevices.execute(query)
    return { devices: items.map(toAdminDeviceDto), total, page, pageSize }
  }
}
