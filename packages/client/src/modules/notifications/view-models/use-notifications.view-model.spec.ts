import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fakes = vi.hoisted(() => ({ environment: undefined as unknown }))

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@tanstack/react-router', async () => (await import('@/shared/test/fake-router')).fakeRouterModule)
vi.mock('@/modules/browser-support/view-models/use-environment-notices.view-model', () => ({
  useEnvironmentNoticesViewModel: () => fakes.environment,
}))

import type { HubNotification } from '@/modules/notifications/model/entities/hub-notification'
import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'
import { navigate } from '@/shared/test/fake-router'

import { createFakeEnvironmentNotices } from './test/fake-environment-notices'
import { approved, kicked } from './test/notifications-seed'
import { createNotificationsViewModelContext } from './test/notifications-view-model-context'
import { useNotificationsViewModel } from './use-notifications.view-model'

const vpn: HubNotification = { id: 'env:vpn', type: 'vpn' }

const setup = async (list = [approved, kicked], environmentNotices: HubNotification[] = []) => {
  const environment = createFakeEnvironmentNotices(environmentNotices)
  fakes.environment = environment
  const context = createNotificationsViewModelContext(list)
  const hook = renderHook(() => useNotificationsViewModel(), { wrapper: context.wrapper })
  await waitFor(() => expect(hook.result.current.notifications).toHaveLength(list.length + environmentNotices.length))
  return { ...context, ...hook, environment }
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

  it('lists the environment notices before the server ones', async () => {
    const { result } = await setup([approved], [vpn])
    expect(result.current.notifications.map((item) => item.id)).toEqual(['env:vpn', 'n1'])
  })

  it('dismisses an environment notice locally, without the API', async () => {
    const { result, environment } = await setup([approved], [vpn])
    act(() => result.current.onDismiss('env:vpn'))
    expect(environment.dismiss).toHaveBeenCalledWith('env:vpn')
    expect(fakeHttp.post).not.toHaveBeenCalled()
  })

  it('clears the environment notices together with the server ones', async () => {
    const { result, environment } = await setup([approved], [vpn])
    act(() => result.current.onClearAll())
    expect(environment.dismissAll).toHaveBeenCalled()
    await waitFor(() => expect(fakeHttp.post).toHaveBeenCalledWith('/me/notifications/dismiss-all'))
  })

  it('asks for the monitors permission through the environment notices', async () => {
    const { result, environment } = await setup()
    act(() => result.current.onAllowMonitors())
    expect(environment.allowMonitors).toHaveBeenCalled()
  })

  it('opens the server of an approval', async () => {
    const { result } = await setup()
    act(() => result.current.onOpenServer('s1'))
    expect(navigate).toHaveBeenCalledWith({ to: '/servers/$serverId', params: { serverId: 's1' } })
  })
})
