import { vi } from 'vitest'

import type { DisplaysPermission, DisplaysService } from '../../model/services/displays.service'

/** `DisplaysService` with a mutable permission; `request` answers `requestResult`. */
function createFakeDisplays(permission: DisplaysPermission = 'prompt') {
  const state = { permission, requestResult: 'granted' as DisplaysPermission }
  const service: DisplaysService = {
    permission: vi.fn(async () => state.permission),
    request: vi.fn(async () => state.requestResult),
    readScreens: vi.fn(async () => []),
  }
  return { service, state }
}

export { createFakeDisplays }
