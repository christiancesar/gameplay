import { vi } from 'vitest'

import { fakeHttp } from '@/shared/test/fake-http'

/** The shared fake http plus `patch`, which the preferences route needs. */
const fakeSettingsHttp = { ...fakeHttp, patch: vi.fn() }

export { fakeSettingsHttp }
