import type { ServerDetail, ServerInvite, ServerMember, JoinRequest } from '@gameplay/contracts'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { settingsHttp } from './server-settings-http'
import { adminMember, ownerMember } from './server-settings-seed'

type SettingsResponses = {
  detail: ServerDetail
  members?: ServerMember[]
  invites?: ServerInvite[]
  requests?: JoinRequest[]
  /** Session user id; the owner by default. */
  userId?: string
}

/** QueryClient with a cached session; the fake http answers the endpoints the settings sections read. */
function createServerSettingsViewModelContext({
  detail,
  members = [ownerMember, adminMember],
  invites = [],
  requests = [],
  userId = 'u1',
}: SettingsResponses) {
  settingsHttp.get.mockImplementation(async (url: string) => {
    if (url === '/servers/s1') return { data: detail }
    if (url === '/servers/s1/members') return { data: { members } }
    if (url === '/servers/s1/invites') return { data: { invites } }
    if (url === '/servers/s1/join-requests') return { data: { requests } }
    throw new Error(`unexpected GET ${url}`)
  })
  settingsHttp.post.mockResolvedValue({ data: undefined })
  settingsHttp.put.mockResolvedValue({ data: undefined })
  settingsHttp.patch.mockResolvedValue({ data: undefined })
  settingsHttp.delete.mockResolvedValue({ data: undefined })
  const context = createQueryClientContext()
  context.queryClient.setQueryData<object>([...sessionQueryOptions.queryKey], { user: { id: userId } })
  return context
}

export { createServerSettingsViewModelContext }
