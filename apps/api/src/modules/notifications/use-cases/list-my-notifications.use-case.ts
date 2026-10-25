import { Injectable } from '@nestjs/common'
import type { NotificationRecord } from '../domain/notification'
import { NotificationsRepository } from '../repositories/notifications.repository'

@Injectable()
export class ListMyNotificationsUseCase {
  constructor(private readonly notifications: NotificationsRepository) {}

  execute(userId: string): Promise<NotificationRecord[]> {
    return this.notifications.listActive(userId)
  }
}
