import type { Notification } from '@gameplay/contracts'

import type { HubNotification } from '@/modules/notifications/model/entities/hub-notification'

/** API types are kebab-case; the panel View switches on camelCase. */
function toHubNotification(notification: Notification): HubNotification {
  const { id, createdAt, server } = notification
  switch (notification.type) {
    case 'join-approved':
      return { id, createdAt, type: 'joinApproved', server }
    case 'join-request-sent':
      return { id, createdAt, type: 'requestSent', server }
    case 'server-deleted':
      return { id, createdAt, type: 'serverDeleted', server }
    case 'invite-expired':
      return { id, createdAt, type: 'inviteExpired', server }
    case 'kicked':
    case 'promoted':
    case 'demoted':
      return { id, createdAt, type: notification.type, server }
  }
}

export { toHubNotification }
