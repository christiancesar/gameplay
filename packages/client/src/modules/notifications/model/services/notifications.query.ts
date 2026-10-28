import { queryOptions } from '@tanstack/react-query'

import { notificationsKeys } from './notifications.keys'
import { listNotifications } from './notifications.service'

/** Stored notifications that were not dismissed, newest first. */
const notificationsListQueryOptions = queryOptions({
  queryKey: notificationsKeys.list(),
  queryFn: listNotifications,
})

export { notificationsListQueryOptions }
