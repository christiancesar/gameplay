import type { NewNotification, NotificationRecord } from '../domain/notification'

export abstract class NotificationsRepository {
  abstract createMany(notifications: NewNotification[]): Promise<NotificationRecord[]>
  // Not dismissed, newest first.
  abstract listActive(userId: string): Promise<NotificationRecord[]>
  // False when the user has no notification with that id. Dismissing again
  // keeps the first date.
  abstract dismiss(userId: string, notificationId: string, at: Date): Promise<boolean>
  abstract dismissAll(userId: string, at: Date): Promise<void>
}
