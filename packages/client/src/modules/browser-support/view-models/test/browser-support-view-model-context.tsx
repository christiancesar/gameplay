import { fakeHttp } from '@/shared/test/fake-http'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { iceConfig } from './browser-support-seed'

/** QueryClient wired to the fake http: the ICE config answers; `null` makes it fail. */
function createBrowserSupportViewModelContext(options: { ice?: typeof iceConfig | null } = {}) {
  const { ice = iceConfig } = options
  fakeHttp.get.mockImplementation(async (url: string) => {
    if (url === '/ice' && ice !== null) return { data: ice }
    throw new Error(`unexpected GET ${url}`)
  })
  return createQueryClientContext()
}

export { createBrowserSupportViewModelContext }
