import { Body, Controller, Get, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { DeviceReport, ListDevicesResponse } from '@gameplay/shared'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import {
  DeviceReportDto,
  ListDevicesResponseDto,
  ManualHardwareDto,
  ReportDeviceRequestDto,
  toDeviceReportDto,
} from '../dtos/account.dto'
import { ListMyDevicesUseCase } from '../use-cases/list-my-devices.use-case'
import { ReportDeviceUseCase } from '../use-cases/report-device.use-case'
import { UpdateDeviceManualInfoUseCase } from '../use-cases/update-device-manual-info.use-case'

@ApiTags('account')
@Controller('me/devices')
export class MyDevicesController {
  constructor(
    private readonly reportDevice: ReportDeviceUseCase,
    private readonly updateManual: UpdateDeviceManualInfoUseCase,
    private readonly listDevices: ListMyDevicesUseCase,
  ) {}

  // Creates the device's report or updates it with a new collection.
  @Post()
  @ZodResponse({ status: HttpStatus.OK, type: DeviceReportDto })
  async report(@CurrentUser() user: AuthUser, @Body() body: ReportDeviceRequestDto): Promise<DeviceReport> {
    return toDeviceReportDto(
      await this.reportDevice.execute({ userId: user.id, deviceId: body.deviceId, collected: body.collected }),
    )
  }

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ListDevicesResponseDto })
  async list(@CurrentUser() user: AuthUser): Promise<ListDevicesResponse> {
    const devices = await this.listDevices.execute(user.id)
    return { devices: devices.map(toDeviceReportDto) }
  }

  @Put(':deviceId/manual')
  @ZodResponse({ status: HttpStatus.OK, type: DeviceReportDto })
  async manual(
    @CurrentUser() user: AuthUser,
    @Param('deviceId') deviceId: string,
    @Body() body: ManualHardwareDto,
  ): Promise<DeviceReport> {
    return toDeviceReportDto(await this.updateManual.execute({ userId: user.id, deviceId, manual: body }))
  }
}
