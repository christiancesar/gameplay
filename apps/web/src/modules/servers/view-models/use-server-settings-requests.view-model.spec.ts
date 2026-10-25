import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('./test/server-settings-http')).settingsHttp }))
vi.mock(
  '@tanstack/react-router',
  async () => (await import('./test/fake-server-settings-router')).fakeServerSettingsRouterModule,
)
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

import { toast } from 'sonner'

import { ApiError } from '@/shared/lib/api-error'

import { createServerSettingsViewModelContext } from './test/server-settings-view-model-context'
import { settingsHttp } from './test/server-settings-http'
import { fullDetail, joinRequest, olderJoinRequest, settingsDetail } from './test/server-settings-seed'
import { useServerSettingsRequestsViewModel } from './use-server-settings-requests.view-model'

const setup = (detail = settingsDetail) => {
  const context = createServerSettingsViewModelContext({ detail, requests: [joinRequest, olderJoinRequest] })
  const hook = renderHook(() => useServerSettingsRequestsViewModel('s1'), { wrapper: context.wrapper })
  return { ...hook, ...context }
}

const ready = async (result: { current: ReturnType<typeof useServerSettingsRequestsViewModel> }) =>
  waitFor(() => {
    expect(result.current.isLoading).toBe(false)
    expect(result.current.requests).toHaveLength(2)
  })

describe('useServerSettingsRequestsViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the requests oldest first with the member counters', async () => {
    const { result } = setup(fullDetail)
    await ready(result)
    expect(result.current.requests.map((request) => request.id)).toEqual(['jr0', 'jr1'])
    expect(result.current).toMatchObject({ memberCount: 4, memberLimit: 4, autoApprove: false })
  })

  it('approves a request, marking it busy meanwhile, and refreshes the server', async () => {
    const { result, queryClient } = setup()
    await ready(result)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    let finish: () => void = () => undefined
    settingsHttp.post.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)))
    act(() => result.current.onApprove('jr1'))
    await waitFor(() => expect(result.current.busyRequestId).toBe('jr1'))
    finish()
    await waitFor(() => expect(result.current.busyRequestId).toBeUndefined())
    expect(settingsHttp.post).toHaveBeenCalledWith('/servers/s1/join-requests/jr1/approve')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['servers', 'detail', 's1'] })
  })

  it('declines a request', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onDecline('jr0'))
    await waitFor(() => expect(settingsHttp.post).toHaveBeenCalledWith('/servers/s1/join-requests/jr0/decline'))
  })

  it('toasts when the request was already decided elsewhere', async () => {
    const { result } = setup()
    await ready(result)
    settingsHttp.post.mockRejectedValueOnce(new ApiError({ code: 'JOIN_REQUEST_DECIDED', message: 'done' }, 409))
    act(() => result.current.onApprove('jr1'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.requestGone'))
  })
})
