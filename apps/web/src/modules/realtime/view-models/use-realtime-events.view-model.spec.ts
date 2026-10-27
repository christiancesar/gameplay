import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/socket', async () => {
  const { fakeSocket } = await import('./test/fake-socket.instance')
  return { createSocket: () => fakeSocket }
})
vi.mock('@tanstack/react-router', async () => (await import('./test/fake-router')).fakeRouterModule)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { server?: string }) => (options?.server ? `${key}:${options.server}` : key),
  }),
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), info: vi.fn() }) }))

import { toast } from 'sonner'

import { notificationsKeys } from '@/modules/notifications/model/services/notifications.keys'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'

import { fakeSocket } from './test/fake-socket.instance'
import { location, navigate } from './test/fake-router'
import { createRealtimeViewModelContext } from './test/realtime-view-model-context'
import { useRealtimeEventsViewModel } from './use-realtime-events.view-model'

describe('useRealtimeEventsViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakeSocket.reset()
    location.pathname = '/'
  })

  const setup = () => {
    const context = createRealtimeViewModelContext()
    const invalidate = vi.spyOn(context.queryClient, 'invalidateQueries')
    const hook = renderHook(() => useRealtimeEventsViewModel(), { wrapper: context.wrapper })
    return { ...context, invalidate, ...hook }
  }

  it('invalidates the server queries and the list on server:changed', () => {
    const { invalidate } = setup()
    fakeSocket.receive('server:changed', { serverId: 's1' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: serversKeys.detail('s1') })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: serversKeys.list() })
  })

  it('invalidates the notifications on notification:new', () => {
    const { invalidate } = setup()
    fakeSocket.receive('notification:new', { id: 'n1' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationsKeys.all })
    expect(toast.info).not.toHaveBeenCalled()
  })

  it('shows a platform announcement right away', () => {
    setup()
    fakeSocket.receive('notification:new', {
      id: 'n1',
      announcement: { title: 'Maintenance', message: 'Back in 10 minutes.' },
    })
    expect(toast.info).toHaveBeenCalledWith('Maintenance', { description: 'Back in 10 minutes.' })
  })

  it('on server:removed while on that server: toast with its name, back to the Hub, cache cleaned', async () => {
    const { invalidate, queryClient } = setup()
    queryClient.setQueryData(serversKeys.detail('s1'), { id: 's1', name: 'Turbex' })
    location.pathname = '/servers/s1'
    fakeSocket.receive('server:removed', { serverId: 's1', reason: 'kicked' })
    expect(toast).toHaveBeenCalledWith('notices.kicked:Turbex')
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true }))
    await waitFor(() => expect(queryClient.getQueryData(serversKeys.detail('s1'))).toBeUndefined())
    expect(invalidate).toHaveBeenCalledWith({ queryKey: serversKeys.list() })
  })

  it('uses the deleted notice and takes the name from the list when there is no detail', () => {
    const { queryClient } = setup()
    queryClient.setQueryData(serversKeys.list(), [{ id: 's2', name: 'Arena' }])
    fakeSocket.receive('server:removed', { serverId: 's2', reason: 'deleted' })
    expect(toast).toHaveBeenCalledWith('notices.serverDeleted:Arena')
  })

  it('on server:removed elsewhere: toast and list refresh, no navigation', async () => {
    const { invalidate } = setup()
    location.pathname = '/servers/other'
    fakeSocket.receive('server:removed', { serverId: 's1', reason: 'left' })
    expect(toast).toHaveBeenCalledWith('notices.leftServer:realtime.unknownServer')
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: serversKeys.list() }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: serversKeys.myLimits() })
    expect(navigate).not.toHaveBeenCalled()
  })

  it('on session:revoked: disconnects, clears the cache and goes to /sign-in with replace', async () => {
    const { queryClient } = setup()
    queryClient.setQueryData(['session'], { user: { id: 'u1' } })
    fakeSocket.receive('session:revoked')
    expect(fakeSocket.disconnect).toHaveBeenCalled()
    expect(queryClient.getQueryData(['session'])).toBeUndefined()
    expect(toast.error).toHaveBeenCalledWith('notices.sessionEnded')
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', replace: true }))
  })

  it('stops listening on unmount', () => {
    const { unmount } = setup()
    unmount()
    for (const event of ['server:changed', 'server:removed', 'session:revoked', 'notification:new']) {
      expect(fakeSocket.listenerCount(event)).toBe(0)
    }
  })
})
