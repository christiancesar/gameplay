import { vi } from 'vitest'

import { fakeHttp } from '@/shared/test/fake-http'

/** The shared fake http has no `patch`, which the server settings use for the general data and rooms. */
const settingsHttp = { ...fakeHttp, patch: vi.fn() }

export { settingsHttp }
