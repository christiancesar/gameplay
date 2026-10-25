import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { ListNotificationsResponse } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { ListNotificationsResponseDto, toNotificationDto } from '../dtos/notification.dto'
import { DismissAllNotificationsUseCase } from '../use-cases/dismiss-all-notifications.use-case'
import { DismissNotificationUseCase } from '../use-cases/dismiss-notification.use-case'
import { ListMyNotificationsUseCase } from '../use-cases/list-my-notifications.use-case'

@ApiTags('notifications')
@Controller('me/notifications')
export class MyNotificationsController {
  constructor(
    private readonly listNotifications: ListMyNotificationsUseCase,
    private readonly dismissNotification: DismissNotificationUseCase,
    private readonly dismissAll: DismissAllNotificationsUseCase,
  ) {}

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ListNotificationsResponseDto })
  async list(@CurrentUser() user: AuthUser): Promise<ListNotificationsResponse> {
    const notifications = await this.listNotifications.execute(user.id)
    return { notifications: notifications.map(toNotificationDto) }
  }

  // Before :notificationId, so "dismiss-all" is not taken for an id.
  @Post('dismiss-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismissEvery(@CurrentUser() user: AuthUser): Promise<void> {
    await this.dismissAll.execute(user.id)
  }

  @Post(':notificationId/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismiss(@CurrentUser() user: AuthUser, @Param('notificationId') notificationId: string): Promise<void> {
    await this.dismissNotification.execute({ userId: user.id, notificationId })
  }
}
