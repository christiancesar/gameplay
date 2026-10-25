import { Injectable } from '@nestjs/common'
import { NotificationNotFoundError } from '../errors/notifications.errors'
import { NotificationsRepository } from '../repositories/notifications.repository'

type Input = { userId: string; notificationId: string }

// Dismissing twice is fine.
@Injectable()
export class DismissNotificationUseCase {
  constructor(private readonly notifications: NotificationsRepository) {}

  async execute({ userId, notificationId }: Input): Promise<void> {
    const found = await this.notifications.dismiss(userId, notificationId, new Date())
    if (!found) throw new NotificationNotFoundError()
  }
}
