import {
  listNotificationsResponseSchema,
  sendAnnouncementRequestSchema,
  sendAnnouncementResponseSchema,
  type Notification,
} from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'
import type { NotificationRecord } from '../domain/notification'

export class ListNotificationsResponseDto extends createZodDto(listNotificationsResponseSchema) {}
export class SendAnnouncementRequestDto extends createZodDto(sendAnnouncementRequestSchema) {}
export class SendAnnouncementResponseDto extends createZodDto(sendAnnouncementResponseSchema) {}

export function toNotificationDto(record: NotificationRecord): Notification {
  const { id } = record
  const createdAt = record.createdAt.toISOString()
  if (record.type === 'platform-announcement') {
    return { id, type: record.type, announcement: { title: record.title, message: record.message }, createdAt }
  }
  return { id, type: record.type, server: { id: record.serverId, name: record.serverName }, createdAt }
}
