import type { MyLimits, ServerSummary } from '@gameplay/contracts'

import { limitsWithRoom } from './servers-seed'
import { createQueryClientContext } from '@/shared/test/query-client-context'
import { fakeHttp } from '@/shared/test/fake-http'

/** QueryClient wired to the fake http: `GET /servers` and `GET /me/limits` answer with the given data. */
function createServersViewModelContext(servers: ServerSummary[] = [], limits: MyLimits = limitsWithRoom) {
  fakeHttp.get.mockImplementation(async (url: string) => {
    if (url === '/servers') return { data: { servers } }
    if (url === '/me/limits') return { data: limits }
    throw new Error(`unexpected GET ${url}`)
  })
  return createQueryClientContext()
}

export { createServersViewModelContext }
