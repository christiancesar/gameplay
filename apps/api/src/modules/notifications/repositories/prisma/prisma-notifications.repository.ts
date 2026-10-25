import { Injectable } from '@nestjs/common'
import type { NotificationType } from '@gameplay/shared'
import type { NotificationType as DbType, Notification as Row } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import type { NewNotification, NotificationRecord } from '../../domain/notification'
import { NotificationsRepository } from '../notifications.repository'

const TO_DB: Record<NotificationType, DbType> = {
  'join-request-sent': 'JOIN_REQUEST_SENT',
  'join-approved': 'JOIN_APPROVED',
  kicked: 'KICKED',
  'server-deleted': 'SERVER_DELETED',
  promoted: 'PROMOTED',
  demoted: 'DEMOTED',
  'invite-expired': 'INVITE_EXPIRED',
}
const FROM_DB = Object.fromEntries(Object.entries(TO_DB).map(([type, db]) => [db, type])) as Record<
  DbType,
  NotificationType
>

// What goes in the JSON column.
type Payload = { serverId: string; serverName: string }

function toRecord(row: Row): NotificationRecord {
  const { serverId, serverName } = row.payload as Payload
  return {
    id: row.id,
    userId: row.userId,
    type: FROM_DB[row.type],
    serverId,
    serverName,
    createdAt: row.createdAt,
    dismissedAt: row.dismissedAt,
  }
}

@Injectable()
export class PrismaNotificationsRepository extends NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async createMany(notifications: NewNotification[]): Promise<NotificationRecord[]> {
    const rows = await this.prisma.notification.createManyAndReturn({
      data: notifications.map(({ userId, type, serverId, serverName }) => ({
        userId,
        type: TO_DB[type],
        payload: { serverId, serverName } satisfies Payload,
      })),
    })
    return rows.map(toRecord)
  }

  async listActive(userId: string): Promise<NotificationRecord[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId, dismissedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })
    return rows.map(toRecord)
  }

  async dismiss(userId: string, notificationId: string, at: Date): Promise<boolean> {
    const found = await this.prisma.notification.count({ where: { id: notificationId, userId } })
    if (found === 0) return false
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, dismissedAt: null },
      data: { dismissedAt: at },
    })
    return true
  }

  async dismissAll(userId: string, at: Date): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, dismissedAt: null }, data: { dismissedAt: at } })
  }
}
