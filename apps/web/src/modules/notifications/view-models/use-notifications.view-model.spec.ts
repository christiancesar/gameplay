import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@tanstack/react-router', async () => (await import('@/shared/test/fake-router')).fakeRouterModule)

import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'
import { navigate } from '@/shared/test/fake-router'

import { approved, kicked } from './test/notifications-seed'
import { createNotificationsViewModelContext } from './test/notifications-view-model-context'
import { useNotificationsViewModel } from './use-notifications.view-model'

const setup = async (list = [approved, kicked]) => {
  const context = createNotificationsViewModelContext(list)
  const hook = renderHook(() => useNotificationsViewModel(), { wrapper: context.wrapper })
  await waitFor(() => expect(hook.result.current.notifications).toHaveLength(list.length))
  return { ...context, ...hook }
}

describe('useNotificationsViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the notifications in the View shape', async () => {
    const { result } = await setup()
    expect(result.current.notifications).toEqual([
      { id: 'n1', type: 'joinApproved', server: approved.server, createdAt: approved.createdAt },
      { id: 'n2', type: 'kicked', server: kicked.server, createdAt: kicked.createdAt },
    ])
  })

  it('starts empty while loading', () => {
    const { wrapper } = createNotificationsViewModelContext([approved])
    const { result } = renderHook(() => useNotificationsViewModel(), { wrapper })
    expect(result.current.notifications).toEqual([])
  })

  it('dismisses one: removes it right away and calls the API', async () => {
    const { result } = await setup()
    act(() => result.current.onDismiss('n1'))
    await waitFor(() => expect(result.current.notifications.map((item) => item.id)).toEqual(['n2']))
    expect(fakeHttp.post).toHaveBeenCalledWith('/me/notifications/n1/dismiss')
  })

  it('dismisses all', async () => {
    const { result } = await setup()
    act(() => result.current.onClearAll())
    await waitFor(() => expect(result.current.notifications).toEqual([]))
    expect(fakeHttp.post).toHaveBeenCalledWith('/me/notifications/dismiss-all')
  })

  it('refetches the list when dismissing fails', async () => {
    const { result } = await setup()
    fakeHttp.post.mockRejectedValue(new ApiError({ code: 'NETWORK_ERROR', message: 'x' }))
    act(() => result.current.onDismiss('n1'))
    await waitFor(() => expect(result.current.notifications).toHaveLength(2))
    expect(fakeHttp.get.mock.calls.length).toBeGreaterThan(1)
  })

  it('opens the server of an approval', async () => {
    const { result } = await setup()
    act(() => result.current.onOpenServer('s1'))
    expect(navigate).toHaveBeenCalledWith({ to: '/servers/$serverId', params: { serverId: 's1' } })
  })
})
