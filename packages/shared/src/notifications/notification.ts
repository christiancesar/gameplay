import { z } from 'zod'

// What a Hub notice is about. Browser, graphics acceleration and monitor
// alerts are worked out by the web and never stored.
export const NOTIFICATION_TYPES = [
  'join-request-sent',
  'join-approved',
  'kicked',
  'server-deleted',
  'promoted',
  'demoted',
  'invite-expired',
] as const
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES)
export type NotificationType = z.infer<typeof notificationTypeSchema>

// Ids and names only: the web writes the text with i18n. The server name is
// the one at the time of the event (the server may be gone).
export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  server: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.iso.datetime(),
})
export type Notification = z.infer<typeof notificationSchema>

// Newest first, only the ones not dismissed.
export const listNotificationsResponseSchema = z.object({ notifications: z.array(notificationSchema) })
export type ListNotificationsResponse = z.infer<typeof listNotificationsResponseSchema>

// Socket.IO: a notification was stored for you; refetch the list.
export const notificationNewSchema = z.object({ id: z.string() })
export type NotificationNew = z.infer<typeof notificationNewSchema>
