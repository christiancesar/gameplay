import { vi } from 'vitest'

import type { HubNotification } from '@/modules/notifications/model/entities/hub-notification'

/** Stand-in for the environment notices ViewModel: fixed notices, spies for the actions. */
function createFakeEnvironmentNotices(notices: HubNotification[] = []) {
  return {
    notices,
    isEnvironmentNotice: (id: string) => id.startsWith('env:'),
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
    allowMonitors: vi.fn(async () => undefined),
  }
}

export { createFakeEnvironmentNotices }
