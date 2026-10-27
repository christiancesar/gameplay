import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type { SfuCloseResponse, SfuSessionResponse, SfuStatusResponse, SfuTracksResponse } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import {
  SfuCloseRequestDto,
  SfuCloseResponseDto,
  SfuLayerRequestDto,
  SfuPublishRequestDto,
  SfuRenegotiateRequestDto,
  SfuSessionResponseDto,
  SfuStatusResponseDto,
  SfuTracksResponseDto,
  SfuWatchRequestDto,
} from '../dtos/sfu.dto'
import { ChangeSfuLayerUseCase } from '../use-cases/change-sfu-layer.use-case'
import { CloseSfuTracksUseCase } from '../use-cases/close-sfu-tracks.use-case'
import { CreateSfuSessionUseCase } from '../use-cases/create-sfu-session.use-case'
import { GetSfuStatusUseCase } from '../use-cases/get-sfu-status.use-case'
import { PublishScreenUseCase } from '../use-cases/publish-screen.use-case'
import { RenegotiateSfuSessionUseCase } from '../use-cases/renegotiate-sfu-session.use-case'
import { WatchScreenUseCase } from '../use-cases/watch-screen.use-case'

// Screen share through the Cloudflare Realtime SFU. The browser negotiates
// here; the API talks to Cloudflare with the app secret.
@ApiTags('realtime')
@Controller('media/sfu')
export class SfuController {
  constructor(
    private readonly getStatus: GetSfuStatusUseCase,
    private readonly createSession: CreateSfuSessionUseCase,
    private readonly publishScreen: PublishScreenUseCase,
    private readonly watchScreen: WatchScreenUseCase,
    private readonly renegotiateSession: RenegotiateSfuSessionUseCase,
    private readonly changeLayer: ChangeSfuLayerUseCase,
    private readonly closeTracks: CloseSfuTracksUseCase,
  ) {}

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: SfuStatusResponseDto })
  status(): Promise<SfuStatusResponse> {
    return this.getStatus.execute()
  }

  @Post('sessions')
  @ZodResponse({ status: HttpStatus.CREATED, type: SfuSessionResponseDto })
  create(@CurrentUser() user: AuthUser): Promise<SfuSessionResponse> {
    return this.createSession.execute({ userId: user.id })
  }

  @Post('sessions/:sessionId/publish')
  @ZodResponse({ status: HttpStatus.OK, type: SfuTracksResponseDto })
  @HttpCode(HttpStatus.OK)
  publish(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
    @Body() body: SfuPublishRequestDto,
  ): Promise<SfuTracksResponse> {
    return this.publishScreen.execute({
      userId: user.id,
      sessionId,
      offer: body.sessionDescription,
      tracks: body.tracks,
    })
  }

  @Post('sessions/:sessionId/watch')
  @ZodResponse({ status: HttpStatus.OK, type: SfuTracksResponseDto })
  @HttpCode(HttpStatus.OK)
  watch(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
    @Body() body: SfuWatchRequestDto,
  ): Promise<SfuTracksResponse> {
    return this.watchScreen.execute({ userId: user.id, sessionId, streamerId: body.streamerId, layer: body.layer })
  }

  @Put('sessions/:sessionId/renegotiate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async renegotiate(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
    @Body() body: SfuRenegotiateRequestDto,
  ): Promise<void> {
    await this.renegotiateSession.execute({ userId: user.id, sessionId, answer: body.sessionDescription })
  }

  @Put('sessions/:sessionId/layer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async layer(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
    @Body() body: SfuLayerRequestDto,
  ): Promise<void> {
    await this.changeLayer.execute({ userId: user.id, sessionId, mid: body.mid, layer: body.layer })
  }

  @Put('sessions/:sessionId/close')
  @ZodResponse({ status: HttpStatus.OK, type: SfuCloseResponseDto })
  close(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
    @Body() body: SfuCloseRequestDto,
  ): Promise<SfuCloseResponse> {
    return this.closeTracks.execute({ userId: user.id, sessionId, mids: body.mids, offer: body.sessionDescription })
  }
}
