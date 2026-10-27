import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Query } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type {
  AdminMediaResponse,
  MediaChangeResponse,
  MediaImpact,
  RealtimeUsagePeriod,
  ServerMediaOverrides,
} from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import type { AuthUser } from '../../../lib/auth'
import {
  AdminMediaResponseDto,
  MediaChangeResponseDto,
  MediaImpactDto,
  MediaImpactQueryDto,
  RealtimeUsagePeriodDto,
  RealtimeUsageQueryDto,
  ServerMediaOverridesDto,
  UpdateMediaSettingsRequestDto,
  UpdateServerMediaRequestDto,
  UpdateSfuBudgetRequestDto,
} from '../dtos/media.dto'
import { GetAdminMediaUseCase } from '../use-cases/get-admin-media.use-case'
import { GetMediaImpactUseCase } from '../use-cases/get-media-impact.use-case'
import { GetRealtimeUsageUseCase } from '../use-cases/get-realtime-usage.use-case'
import { GetServerMediaOverridesUseCase } from '../use-cases/get-server-media-overrides.use-case'
import { UpdateMediaSettingsUseCase } from '../use-cases/update-media-settings.use-case'
import { UpdateServerMediaUseCase } from '../use-cases/update-server-media.use-case'
import { UpdateSfuBudgetUseCase } from '../use-cases/update-sfu-budget.use-case'

// Media resources (SFU, mesh, TURN) for the platform and per server.
@ApiTags('admin: media')
@PlatformAdmin()
@Controller('admin')
export class AdminMediaController {
  constructor(
    private readonly getMedia: GetAdminMediaUseCase,
    private readonly getImpact: GetMediaImpactUseCase,
    private readonly updateSettings: UpdateMediaSettingsUseCase,
    private readonly getServerOverrides: GetServerMediaOverridesUseCase,
    private readonly updateServer: UpdateServerMediaUseCase,
    private readonly updateBudget: UpdateSfuBudgetUseCase,
    private readonly getUsage: GetRealtimeUsageUseCase,
  ) {}

  @Get('media')
  @ZodResponse({ status: HttpStatus.OK, type: AdminMediaResponseDto })
  get(): Promise<AdminMediaResponse> {
    return this.getMedia.execute()
  }

  // Before turning something off: how many people it would cut off now.
  @Get('media/impact')
  @ZodResponse({ status: HttpStatus.OK, type: MediaImpactDto })
  impact(@Query() query: MediaImpactQueryDto): Promise<MediaImpact> {
    return this.getImpact.execute(query.serverId ?? null)
  }

  // SFU and TURN egress Cloudflare billed in a period (at most the last 30 days).
  @Get('media/usage')
  @ZodResponse({ status: HttpStatus.OK, type: RealtimeUsagePeriodDto })
  usage(@Query() query: RealtimeUsageQueryDto): Promise<RealtimeUsagePeriod> {
    return this.getUsage.execute(query)
  }

  @Put('media')
  @ZodResponse({ status: HttpStatus.OK, type: MediaChangeResponseDto })
  update(@CurrentUser() user: AuthUser, @Body() body: UpdateMediaSettingsRequestDto): Promise<MediaChangeResponse> {
    return this.updateSettings.execute({ settings: body.settings, notice: body.notice, sentById: user.id })
  }

  @Put('media/budget')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async budget(@CurrentUser() user: AuthUser, @Body() body: UpdateSfuBudgetRequestDto): Promise<void> {
    await this.updateBudget.execute({ budgetGb: body.budgetGb, changedById: user.id })
  }

  @Get('servers/:serverId/media')
  @ZodResponse({ status: HttpStatus.OK, type: ServerMediaOverridesDto })
  serverOverrides(@Param('serverId') serverId: string): Promise<ServerMediaOverrides> {
    return this.getServerOverrides.execute(serverId)
  }

  @Put('servers/:serverId/media')
  @ZodResponse({ status: HttpStatus.OK, type: MediaChangeResponseDto })
  updateServerMedia(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Body() body: UpdateServerMediaRequestDto,
  ): Promise<MediaChangeResponse> {
    return this.updateServer.execute({ serverId, overrides: body.overrides, notice: body.notice, sentById: user.id })
  }
}
