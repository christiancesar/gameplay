import { fakeHttp } from '@/shared/test/fake-http'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { generatedInvite } from './admin-seed'
import { defaultResponses, type AdminResponses } from './admin-responses'

/** QueryClient wired to the fake http: every admin GET answers from `responses`; writes resolve empty. */
function createAdminViewModelContext(responses: Partial<AdminResponses> = {}) {
  const api = { ...defaultResponses, ...responses }
  fakeHttp.get.mockImplementation(async (url: string) => {
    const sessions = /^\/admin\/users\/([^/]+)\/sessions$/.exec(url)
    const devices = /^\/admin\/users\/([^/]+)\/devices$/.exec(url)
    if (url === '/admin/users') return { data: { users: api.users, total: api.users.length, page: 1, pageSize: 100 } }
    if (sessions) return { data: { sessions: api.sessionsByUser[sessions[1]] ?? [] } }
    if (devices) return { data: { devices: api.devicesByUser[devices[1]] ?? [] } }
    if (url === '/admin/hardware/devices') {
      return { data: { devices: api.devices, total: api.devices.length, page: 1, pageSize: 100 } }
    }
    if (url === '/admin/servers') {
      return { data: { servers: api.servers, total: api.servers.length, page: 1, pageSize: 100 } }
    }
    if (url.startsWith('/admin/servers/')) return { data: api.serverDetail }
    if (url === '/admin/hardware/summary') return { data: api.summary }
    if (url === '/admin/settings') return { data: api.settings }
    if (url === '/admin/registration-invites') return { data: { invites: api.invites } }
    throw new Error(`unexpected GET ${url}`)
  })
  fakeHttp.post.mockImplementation(async (url: string, body?: { password?: string; validity?: string }) => {
    if (url.endsWith('/password')) return { data: { password: body?.password ?? '' } }
    if (url === '/admin/registration-invites') return { data: { key: 'ABC234', invite: generatedInvite } }
    if (url === '/admin/announcements') return { data: { recipients: 3 } }
    return { data: undefined }
  })
  fakeHttp.put.mockResolvedValue({ data: undefined })
  fakeHttp.delete.mockResolvedValue({ data: undefined })
  return createQueryClientContext()
}

export { createAdminViewModelContext }
