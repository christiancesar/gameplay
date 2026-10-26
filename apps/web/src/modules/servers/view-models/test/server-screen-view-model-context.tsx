import type { ServerDetail, ServerSummary } from '@gameplay/contracts'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { members } from './server-screen-seed'

type ServerScreenResponses = {
  detail: ServerDetail | ApiError
  servers?: ServerSummary[]
  session: object
}

/** QueryClient with a cached session; the fake http answers the server screen endpoints. */
function createServerScreenViewModelContext({ detail, servers = [], session }: ServerScreenResponses) {
  fakeHttp.get.mockImplementation(async (url: string) => {
    if (url === '/servers') return { data: { servers } }
    if (url === '/servers/s1') {
      if (detail instanceof ApiError) throw detail
      return { data: detail }
    }
    if (url === '/servers/s1/members') return { data: { members } }
    throw new Error(`unexpected GET ${url}`)
  })
  fakeHttp.post.mockResolvedValue({ data: undefined })
  const context = createQueryClientContext()
  context.queryClient.setQueryData<object>([...sessionQueryOptions.queryKey], session)
  return context
}

export { createServerScreenViewModelContext }
