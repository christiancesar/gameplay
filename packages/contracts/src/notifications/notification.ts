import { z } from 'zod'

// What a Hub notice is about. Browser, graphics acceleration and monitor
// alerts are worked out by the web and never stored.
export const SERVER_NOTIFICATION_TYPES = [
  'join-request-sent',
  'join-approved',
  'kicked',
  'server-deleted',
  'promoted',
  'demoted',
  'invite-expired',
] as const
export const serverNotificationTypeSchema = z.enum(SERVER_NOTIFICATION_TYPES)
export type ServerNotificationType = z.infer<typeof serverNotificationTypeSchema>

// Written by the platform admin; the only notice whose text is not i18n.
export const NOTIFICATION_TYPES = [...SERVER_NOTIFICATION_TYPES, 'platform-announcement'] as const
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES)
export type NotificationType = z.infer<typeof notificationTypeSchema>

export const ANNOUNCEMENT_TITLE_MAX = 80
export const ANNOUNCEMENT_MESSAGE_MAX = 500
export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(ANNOUNCEMENT_TITLE_MAX),
  message: z.string().trim().min(1).max(ANNOUNCEMENT_MESSAGE_MAX),
})
export type Announcement = z.infer<typeof announcementSchema>

// Server notices carry ids and names only: the web writes the text with
// i18n. The server name is the one at the time of the event (the server may
// be gone).
export const notificationSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: serverNotificationTypeSchema,
    server: z.object({ id: z.string(), name: z.string() }),
    createdAt: z.iso.datetime(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('platform-announcement'),
    announcement: announcementSchema,
    createdAt: z.iso.datetime(),
  }),
])
export type Notification = z.infer<typeof notificationSchema>

// Newest first, only the ones not dismissed.
export const listNotificationsResponseSchema = z.object({ notifications: z.array(notificationSchema) })
export type ListNotificationsResponse = z.infer<typeof listNotificationsResponseSchema>

// Socket.IO: a notification was stored for you; refetch the list. A platform
// announcement comes along, so the web can show it right away.
export const notificationNewSchema = z.object({ id: z.string(), announcement: announcementSchema.optional() })
export type NotificationNew = z.infer<typeof notificationNewSchema>

// Who gets a platform announcement.
export const ANNOUNCEMENT_USERS_MAX = 500
export const announcementAudienceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('everyone') }),
  // Members of the server.
  z.object({ type: z.literal('server'), serverId: z.string().min(1) }),
  // Picked by the API itself, e.g. the people a media change cut off.
  z.object({ type: z.literal('users'), userIds: z.array(z.string().min(1)).min(1).max(ANNOUNCEMENT_USERS_MAX) }),
])
export type AnnouncementAudience = z.infer<typeof announcementAudienceSchema>

export const sendAnnouncementRequestSchema = announcementSchema.extend({ audience: announcementAudienceSchema })
export type SendAnnouncementRequest = z.infer<typeof sendAnnouncementRequestSchema>

// How many people got it.
export const sendAnnouncementResponseSchema = z.object({ recipients: z.number().int().min(0) })
export type SendAnnouncementResponse = z.infer<typeof sendAnnouncementResponseSchema>
