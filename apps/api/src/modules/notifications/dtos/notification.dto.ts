import { listNotificationsResponseSchema, type Notification } from '@gameplay/shared'
import { createZodDto } from 'nestjs-zod'
import type { NotificationRecord } from '../domain/notification'

export class ListNotificationsResponseDto extends createZodDto(listNotificationsResponseSchema) {}

export function toNotificationDto(record: NotificationRecord): Notification {
  return {
    id: record.id,
    type: record.type,
    server: { id: record.serverId, name: record.serverName },
    createdAt: record.createdAt.toISOString(),
  }
}
