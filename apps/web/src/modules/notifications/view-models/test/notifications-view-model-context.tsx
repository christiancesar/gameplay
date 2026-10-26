import type { Notification } from '@gameplay/contracts'

import { fakeHttp } from '@/shared/test/fake-http'
import { createQueryClientContext } from '@/shared/test/query-client-context'

/** QueryClient wired to the fake http: `GET /me/notifications` answers with the given list. */
function createNotificationsViewModelContext(notifications: Notification[]) {
  fakeHttp.get.mockImplementation(async (url: string) => {
    if (url === '/me/notifications') return { data: { notifications } }
    throw new Error(`unexpected GET ${url}`)
  })
  fakeHttp.post.mockResolvedValue({ data: undefined })
  return createQueryClientContext()
}

export { createNotificationsViewModelContext }
