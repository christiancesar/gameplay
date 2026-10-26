import { fakeHttp } from '@/shared/test/fake-http'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { iceConfig } from './browser-support-seed'

/** QueryClient wired to the fake http: the public settings and the ICE config answer; `null` makes one fail. */
function createBrowserSupportViewModelContext(
  options: { minChromiumVersion?: number | null; ice?: typeof iceConfig | null } = {},
) {
  const { minChromiumVersion = 130, ice = iceConfig } = options
  fakeHttp.get.mockImplementation(async (url: string) => {
    if (url === '/settings/public' && minChromiumVersion !== null) return { data: { minChromiumVersion } }
    if (url === '/ice' && ice !== null) return { data: ice }
    throw new Error(`unexpected GET ${url}`)
  })
  return createQueryClientContext()
}

export { createBrowserSupportViewModelContext }
