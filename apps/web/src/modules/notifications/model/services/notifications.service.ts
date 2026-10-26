import { listNotificationsResponseSchema, type Notification } from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

async function listNotifications(): Promise<Notification[]> {
  const { data } = await http.get('/me/notifications')
  return listNotificationsResponseSchema.parse(data).notifications
}

async function dismissNotification(notificationId: string): Promise<void> {
  await http.post(`/me/notifications/${notificationId}/dismiss`)
}

async function dismissAllNotifications(): Promise<void> {
  await http.post('/me/notifications/dismiss-all')
}

export { dismissAllNotifications, dismissNotification, listNotifications }
