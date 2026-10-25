import type { NewNotification, NotificationRecord } from '../../domain/notification'
import { NotificationsRepository } from '../notifications.repository'

export class InMemoryNotificationsRepository extends NotificationsRepository {
  readonly notifications: NotificationRecord[] = []
  private sequence = 0

  async createMany(notifications: NewNotification[]): Promise<NotificationRecord[]> {
    return notifications.map((notification) => {
      this.sequence += 1
      // Later ones sort as newer even within the same millisecond.
      const record = {
        ...notification,
        id: `notification-${this.sequence}`,
        createdAt: new Date(Date.now() + this.sequence),
        dismissedAt: null,
      }
      this.notifications.push(record)
      return { ...record }
    })
  }

  async listActive(userId: string): Promise<NotificationRecord[]> {
    return this.notifications
      .filter((notification) => notification.userId === userId && !notification.dismissedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((notification) => ({ ...notification }))
  }

  async dismiss(userId: string, notificationId: string, at: Date): Promise<boolean> {
    const notification = this.notifications.find(({ id }) => id === notificationId)
    if (!notification || notification.userId !== userId) return false
    notification.dismissedAt ??= at
    return true
  }

  async dismissAll(userId: string, at: Date): Promise<void> {
    for (const notification of this.notifications) {
      if (notification.userId === userId) notification.dismissedAt ??= at
    }
  }
}
