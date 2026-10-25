import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/socket', async () => {
  const { fakeSocket } = await import('./test/fake-socket.instance')
  return { createSocket: () => fakeSocket }
})
vi.mock('@tanstack/react-router', async () => (await import('./test/fake-router')).fakeRouterModule)
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

import { fakeSocket } from './test/fake-socket.instance'
import { createRealtimeViewModelContext } from './test/realtime-view-model-context'
import { useConnectionStore } from './stores/connection.store'
import { useRealtimeConnectionViewModel } from './use-realtime-connection.view-model'

describe('useRealtimeConnectionViewModel', () => {
  beforeEach(() => {
    fakeSocket.reset()
    useConnectionStore.getState().reset()
  })

  const setup = () =>
    renderHook(() => useRealtimeConnectionViewModel(), { wrapper: createRealtimeViewModelContext().wrapper })

  it('connects on mount and mirrors the socket status in the store', () => {
    setup()
    expect(fakeSocket.connect).toHaveBeenCalledTimes(1)
    expect(useConnectionStore.getState().status).toBe('connected')
    act(() => fakeSocket.receive('disconnect', 'transport close'))
    expect(useConnectionStore.getState().status).toBe('reconnecting')
    act(() => fakeSocket.receive('connect'))
    expect(useConnectionStore.getState()).toMatchObject({ status: 'connected', recovered: true })
  })

  it('disconnects and resets the store on unmount', () => {
    const { unmount } = setup()
    unmount()
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(useConnectionStore.getState().status).toBe('disconnected')
    expect(fakeSocket.listenerCount('connect')).toBe(0)
  })
})
