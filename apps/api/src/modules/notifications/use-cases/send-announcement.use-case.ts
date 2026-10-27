import { Injectable, Logger } from '@nestjs/common'
import type { Announcement, AnnouncementAudience } from '@gameplay/contracts'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ServerNotFoundError } from '../../servers/errors/servers.errors'
import { ServersRepository } from '../../servers/repositories/servers.repository'
import { NotificationsRepository } from '../repositories/notifications.repository'
import { RecipientsRepository } from '../repositories/recipients.repository'

type Input = Announcement & { audience: AnnouncementAudience; sentById: string }

// The platform admin tells people something: maintenance, a deploy, a media
// resource turned off. Stored like any Hub notice; whoever is online also
// gets it right away through notification:new.
@Injectable()
export class SendAnnouncementUseCase {
  private readonly logger = new Logger(SendAnnouncementUseCase.name)

  constructor(
    private readonly notifications: NotificationsRepository,
    private readonly recipients: RecipientsRepository,
    private readonly servers: ServersRepository,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ title, message, audience, sentById }: Input): Promise<{ recipients: number }> {
    const userIds = [...new Set(await this.recipientsOf(audience))]
    const created = await this.notifications.createMany(
      userIds.map((userId) => ({ userId, type: 'platform-announcement' as const, title, message })),
    )
    for (const { id, userId } of created) {
      await this.events.publish('notification.created', {
        userId,
        notificationId: id,
        announcement: { title, message },
      })
    }
    this.logger.log({ sentById, audience: audience.type, recipients: created.length }, 'Platform announcement sent')
    return { recipients: created.length }
  }

  private async recipientsOf(audience: AnnouncementAudience): Promise<string[]> {
    switch (audience.type) {
      case 'everyone':
        return this.recipients.allUserIds()
      case 'server': {
        if (!(await this.servers.findById(audience.serverId))) throw new ServerNotFoundError()
        return this.servers.listMemberIds(audience.serverId)
      }
      case 'users':
        return this.recipients.existingUserIds(audience.userIds)
    }
  }
}
