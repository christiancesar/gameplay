import { Controller, Get, HttpStatus, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { IceConfigResponse } from '@gameplay/shared'
import type { Request } from 'express'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { IceConfigResponseDto } from '../dtos/ice.dto'
import { GetIceConfigUseCase } from '../use-cases/get-ice-config.use-case'

@ApiTags('realtime')
@Controller('ice')
export class IceController {
  constructor(private readonly getIceConfig: GetIceConfigUseCase) {}

  // Called before joining a voice room.
  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: IceConfigResponseDto })
  async get(@CurrentUser() user: AuthUser, @Req() request: Request): Promise<IceConfigResponse> {
    const { iceServers, ttlSeconds } = await this.getIceConfig.execute(user.id)
    return { iceServers, ttlSeconds, requestIp: clientIp(request) }
  }
}

// request.ip follows X-Forwarded-For only for the trusted proxy hops
// (TRUST_PROXY_HOPS). IPv4 clients on a dual-stack socket show up as
// "::ffff:1.2.3.4".
function clientIp(request: Request): string | null {
  return request.ip?.replace(/^::ffff:/, '') ?? null
}
