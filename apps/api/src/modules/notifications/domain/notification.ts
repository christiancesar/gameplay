import type { NotificationType } from '@gameplay/shared'

export type NotificationRecord = {
  id: string
  userId: string
  type: NotificationType
  serverId: string
  // As it was when the event happened.
  serverName: string
  createdAt: Date
  dismissedAt: Date | null
}

export type NewNotification = Pick<NotificationRecord, 'userId' | 'type' | 'serverId' | 'serverName'>
