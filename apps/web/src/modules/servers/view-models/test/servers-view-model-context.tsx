import type { ServerSummary } from '@gameplay/contracts'

import { createQueryClientContext } from '@/shared/test/query-client-context'
import { fakeHttp } from '@/shared/test/fake-http'

/** QueryClient wired to the fake http: `GET /servers` answers with the given list. */
function createServersViewModelContext(servers: ServerSummary[] = []) {
  fakeHttp.get.mockImplementation(async (url: string) => {
    if (url === '/servers') return { data: { servers } }
    throw new Error(`unexpected GET ${url}`)
  })
  return createQueryClientContext()
}

export { createServersViewModelContext }
