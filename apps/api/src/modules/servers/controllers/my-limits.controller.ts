import { Controller, Get, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { MyLimits } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { MyLimitsDto } from '../dtos/server.dto'
import { GetMyLimitsUseCase } from '../use-cases/get-my-limits.use-case'

@ApiTags('account')
@Controller('me/limits')
export class MyLimitsController {
  constructor(private readonly getLimits: GetMyLimitsUseCase) {}

  // The server limit in force for the signed-in user, and how many they own.
  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: MyLimitsDto })
  get(@CurrentUser() user: AuthUser): Promise<MyLimits> {
    return this.getLimits.execute(user.id)
  }
}
