import { makeServersContext } from '../../servers/test/servers-context'
import { NotificationsListener } from '../listeners/domain-events.listener'
import { InMemoryNotificationsRepository } from '../repositories/in-memory/in-memory-notifications.repository'
import { InMemoryRecipientsRepository } from '../repositories/in-memory/in-memory-recipients.repository'
import { DismissAllNotificationsUseCase } from '../use-cases/dismiss-all-notifications.use-case'
import { DismissNotificationUseCase } from '../use-cases/dismiss-notification.use-case'
import { ListMyNotificationsUseCase } from '../use-cases/list-my-notifications.use-case'
import { NotifyUseCase } from '../use-cases/notify.use-case'
import { SendAnnouncementUseCase } from '../use-cases/send-announcement.use-case'
import { SEED_SERVER, SEED_USER_IDS } from './notifications-seed'

// Every notifications use-case wired to in-memory fakes, over the seed.
export function makeNotificationsContext() {
  const { servers, events } = makeServersContext()
  servers.servers.set(SEED_SERVER.id, { ...SEED_SERVER })

  const notifications = new InMemoryNotificationsRepository()
  const notify = new NotifyUseCase(notifications, servers, events)
  const recipients = new InMemoryRecipientsRepository()
  for (const userId of SEED_USER_IDS) recipients.userIds.add(userId)
  return {
    servers,
    events,
    notifications,
    notify,
    recipients,
    sendAnnouncement: new SendAnnouncementUseCase(notifications, recipients, servers, events),
    list: new ListMyNotificationsUseCase(notifications),
    dismiss: new DismissNotificationUseCase(notifications),
    dismissAll: new DismissAllNotificationsUseCase(notifications),
    listener: new NotificationsListener(notify),
  }
}
