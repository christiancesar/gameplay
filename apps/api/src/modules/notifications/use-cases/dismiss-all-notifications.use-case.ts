import { Injectable } from '@nestjs/common'
import { NotificationsRepository } from '../repositories/notifications.repository'

@Injectable()
export class DismissAllNotificationsUseCase {
  constructor(private readonly notifications: NotificationsRepository) {}

  execute(userId: string): Promise<void> {
    return this.notifications.dismissAll(userId, new Date())
  }
}
