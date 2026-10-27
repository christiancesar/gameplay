import type { Announcement, ServerNotificationType } from '@gameplay/contracts'

// What a notification says: about a server (the web writes the text), or a
// platform announcement written by the admin.
export type NotificationContent =
  | {
      type: ServerNotificationType
      serverId: string
      // As it was when the event happened.
      serverName: string
    }
  | ({ type: 'platform-announcement' } & Announcement)

export type NotificationRecord = NotificationContent & {
  id: string
  userId: string
  createdAt: Date
  dismissedAt: Date | null
}

export type NewNotification = NotificationContent & { userId: string }
