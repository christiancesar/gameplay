import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type {
  ListAdminSessionsResponse,
  ListAdminUsersResponse,
  ListDevicesResponse,
  ResetPasswordResponse,
} from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import type { AuthUser } from '../../../lib/auth'
import { ListDevicesResponseDto, toDeviceReportDto } from '../../accounts/dtos/account.dto'
import {
  AdminListQueryDto,
  ListAdminSessionsResponseDto,
  ListAdminUsersResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  toAdminSessionDto,
  toAdminUserDto,
} from '../dtos/platform-admin.dto'
import { GetUserDevicesUseCase } from '../use-cases/get-user-devices.use-case'
import { RevokeUserSessionUseCase } from '../use-cases/revoke-user-session.use-case'
import { ListUserSessionsUseCase } from '../use-cases/list-user-sessions.use-case'
import { ListUsersUseCase } from '../use-cases/list-users.use-case'
import { ReactivateUserUseCase } from '../use-cases/reactivate-user.use-case'
import { ResetUserPasswordUseCase } from '../use-cases/reset-user-password.use-case'
import { RevokeUserSessionsUseCase } from '../use-cases/revoke-user-sessions.use-case'
import { SuspendUserUseCase } from '../use-cases/suspend-user.use-case'

@ApiTags('admin: users')
@PlatformAdmin()
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly listSessions: ListUserSessionsUseCase,
    private readonly revokeSessions: RevokeUserSessionsUseCase,
    private readonly revokeSession: RevokeUserSessionUseCase,
    private readonly suspendUser: SuspendUserUseCase,
    private readonly reactivateUser: ReactivateUserUseCase,
    private readonly resetPassword: ResetUserPasswordUseCase,
    private readonly getDevices: GetUserDevicesUseCase,
  ) {}

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ListAdminUsersResponseDto })
  async list(@Query() query: AdminListQueryDto): Promise<ListAdminUsersResponse> {
    const { page, pageSize } = query
    const { items, total } = await this.listUsers.execute(query)
    return { users: items.map(toAdminUserDto), total, page, pageSize }
  }

  @Get(':userId/sessions')
  @ZodResponse({ status: HttpStatus.OK, type: ListAdminSessionsResponseDto })
  async sessions(@Param('userId') userId: string): Promise<ListAdminSessionsResponse> {
    return { sessions: (await this.listSessions.execute(userId)).map(toAdminSessionDto) }
  }

  @Post(':userId/sessions/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param('userId') userId: string): Promise<void> {
    await this.revokeSessions.execute(userId)
  }

  // 404 when the session is not one of this user's.
  @Post(':userId/sessions/:sessionId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async revokeOne(@Param('userId') userId: string, @Param('sessionId') sessionId: string): Promise<void> {
    await this.revokeSession.execute({ userId, sessionId })
  }

  @Post(':userId/suspend')
  @HttpCode(HttpStatus.NO_CONTENT)
  async suspend(@CurrentUser() admin: AuthUser, @Param('userId') userId: string): Promise<void> {
    await this.suspendUser.execute({ adminId: admin.id, userId })
  }

  @Post(':userId/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reactivate(@Param('userId') userId: string): Promise<void> {
    await this.reactivateUser.execute(userId)
  }

  // The password shows only in this response.
  @Post(':userId/password')
  @ZodResponse({ status: HttpStatus.OK, type: ResetPasswordResponseDto })
  async password(
    @Param('userId') userId: string,
    @Body() { password }: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponse> {
    return this.resetPassword.execute({ userId, password })
  }

  @Get(':userId/devices')
  @ZodResponse({ status: HttpStatus.OK, type: ListDevicesResponseDto })
  async devices(@Param('userId') userId: string): Promise<ListDevicesResponse> {
    return { devices: (await this.getDevices.execute(userId)).map(toDeviceReportDto) }
  }
}
