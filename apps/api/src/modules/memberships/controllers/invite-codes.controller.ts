import { Controller, Get, HttpStatus, Param, Post, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { serverInviteCodeSchema, type JoinServerResponse, type ResolvedInvite } from '@gameplay/shared'
import { OptionalAuth } from '@thallesp/nestjs-better-auth'
import type { Request } from 'express'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { JoinServerResponseDto, ResolvedInviteDto } from '../dtos/membership.dto'
import { ServerInviteNotFoundError } from '../errors/memberships.errors'
import { RequestToJoinUseCase } from '../use-cases/request-to-join.use-case'
import { ResolveInviteCodeUseCase } from '../use-cases/resolve-invite-code.use-case'

// The code in the link (or typed in the Hub), any case. A code in the wrong
// format is just one that doesn't exist.
function parseCode(code: string): string | null {
  const parsed = serverInviteCodeSchema.safeParse(code)
  return parsed.success ? parsed.data : null
}

@ApiTags('server invites')
@Controller('invites/:code')
export class InviteCodesController {
  constructor(
    private readonly resolveInvite: ResolveInviteCodeUseCase,
    private readonly requestToJoin: RequestToJoinUseCase,
  ) {}

  // The invite landing calls it before sign-in too.
  @Get()
  @OptionalAuth()
  @ZodResponse({ status: HttpStatus.OK, type: ResolvedInviteDto })
  resolve(@Param('code') code: string, @Req() request: Request & { user?: AuthUser }): Promise<ResolvedInvite> {
    const parsed = parseCode(code)
    if (!parsed) return Promise.resolve({ status: 'not-found', server: null, alreadyMember: false })
    return this.resolveInvite.execute({ code: parsed, userId: request.user?.id ?? null })
  }

  @Post('join')
  @ZodResponse({ status: HttpStatus.OK, type: JoinServerResponseDto })
  join(@CurrentUser() user: AuthUser, @Param('code') code: string): Promise<JoinServerResponse> {
    const parsed = parseCode(code)
    if (!parsed) throw new ServerInviteNotFoundError()
    return this.requestToJoin.execute({ code: parsed, userId: user.id })
  }
}
