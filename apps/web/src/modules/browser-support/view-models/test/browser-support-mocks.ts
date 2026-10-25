import { vi } from 'vitest'

/**
 * Holders for the fakes the ViewModels' service modules are mocked with (use inside `vi.mock`
 * factories through Proxies, so each test can swap the fake before rendering).
 */
const fakes = vi.hoisted(() => ({
  environment: undefined as unknown,
  dismissed: undefined as unknown,
  displays: undefined as unknown,
  reporter: undefined as unknown,
}))

export { fakes }
