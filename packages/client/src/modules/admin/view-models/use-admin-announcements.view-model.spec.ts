import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))

import { toast } from 'sonner'

import { fakeHttp } from '@/shared/test/fake-http'

import { createAdminViewModelContext } from './test/admin-view-model-context'
import { useAdminAnnouncementsViewModel } from './use-admin-announcements.view-model'

const values = { title: 'Maintenance', message: 'Back in 10 minutes.' }

const setup = async () => {
  const context = createAdminViewModelContext()
  const hook = renderHook(() => useAdminAnnouncementsViewModel(), { wrapper: context.wrapper })
  await waitFor(() => expect(hook.result.current.servers.length).toBeGreaterThan(0))
  return { ...context, ...hook }
}

describe('useAdminAnnouncementsViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers the servers by id and name', async () => {
    const { result } = await setup()
    expect(Object.keys(result.current.servers[0])).toEqual(['id', 'name'])
  })

  it('sends to everyone, confirms with the count and starts a new form', async () => {
    const { result } = await setup()
    act(() => result.current.onSend({ ...values, audience: 'everyone', serverId: '' }))

    await waitFor(() => expect(result.current.formKey).toBe(1))
    expect(fakeHttp.post).toHaveBeenCalledWith('/admin/announcements', { ...values, audience: { type: 'everyone' } })
    expect(toast.success).toHaveBeenCalledWith('admin.announcements.sent')
  })

  it("sends to a server's members", async () => {
    const { result } = await setup()
    act(() => result.current.onSend({ ...values, audience: 'server', serverId: 's1' }))

    await waitFor(() =>
      expect(fakeHttp.post).toHaveBeenCalledWith('/admin/announcements', {
        ...values,
        audience: { type: 'server', serverId: 's1' },
      }),
    )
  })

  it('keeps the form and shows a toast when sending fails', async () => {
    const { result } = await setup()
    fakeHttp.post.mockRejectedValueOnce(new Error('offline'))
    act(() => result.current.onSend({ ...values, audience: 'everyone', serverId: '' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(result.current.formKey).toBe(0)
  })
})
