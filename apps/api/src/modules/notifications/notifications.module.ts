import { Module } from '@nestjs/common'
import { ServersModule } from '../servers/servers.module'
import { AdminAnnouncementsController } from './controllers/admin-announcements.controller'
import { MyNotificationsController } from './controllers/my-notifications.controller'
import { NotificationsListener } from './listeners/domain-events.listener'
import { NotificationsRepository } from './repositories/notifications.repository'
import { PrismaNotificationsRepository } from './repositories/prisma/prisma-notifications.repository'
import { PrismaRecipientsRepository } from './repositories/prisma/prisma-recipients.repository'
import { RecipientsRepository } from './repositories/recipients.repository'
import { DismissAllNotificationsUseCase } from './use-cases/dismiss-all-notifications.use-case'
import { DismissNotificationUseCase } from './use-cases/dismiss-notification.use-case'
import { ListMyNotificationsUseCase } from './use-cases/list-my-notifications.use-case'
import { NotifyUseCase } from './use-cases/notify.use-case'
import { SendAnnouncementUseCase } from './use-cases/send-announcement.use-case'

// Hub notifications, stored per user from domain events until dismissed, and
// the platform admin's announcements. It
// publishes notification.created; the realtime gateway tells the tabs, so
// this module does not import it.
@Module({
  imports: [ServersModule],
  controllers: [MyNotificationsController, AdminAnnouncementsController],
  providers: [
    { provide: NotificationsRepository, useClass: PrismaNotificationsRepository },
    { provide: RecipientsRepository, useClass: PrismaRecipientsRepository },
    NotificationsListener,
    NotifyUseCase,
    ListMyNotificationsUseCase,
    DismissNotificationUseCase,
    DismissAllNotificationsUseCase,
    SendAnnouncementUseCase,
  ],
  exports: [SendAnnouncementUseCase],
})
export class NotificationsModule {}
