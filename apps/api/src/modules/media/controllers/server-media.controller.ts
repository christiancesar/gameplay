import { Controller, Get, HttpStatus, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { ServerMedia } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { ServerMediaDto } from '../dtos/media.dto'
import { GetServerMediaUseCase } from '../use-cases/get-server-media.use-case'

@ApiTags('realtime')
@Controller('servers/:serverId/media')
export class ServerMediaController {
  constructor(private readonly getServerMedia: GetServerMediaUseCase) {}

  // What the server offers now; refetch on media:changed.
  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ServerMediaDto })
  get(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<ServerMedia> {
    return this.getServerMedia.execute({ userId: user.id, serverId })
  }
}
