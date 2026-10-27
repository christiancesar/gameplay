import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/socket', async () => {
  const { fakeSocket } = await import('./test/fake-socket.instance')
  return { createSocket: () => fakeSocket }
})

import { usePresenceStore } from './stores/presence.store'
import { fakeSocket } from './test/fake-socket.instance'
import { snapshotS1, snapshotS2 } from './test/realtime-seed'
import { useServerSubscriptionViewModel } from './use-server-subscription.view-model'

const subscribes = () => fakeSocket.emitted.filter((call) => call.event === 'server:subscribe')

describe('useServerSubscriptionViewModel', () => {
  beforeEach(() => {
    fakeSocket.reset()
    usePresenceStore.getState().reset()
  })

  it('subscribes on mount when the socket is already connected', () => {
    fakeSocket.connected = true
    renderHook(() => useServerSubscriptionViewModel('s1'))
    expect(subscribes()).toHaveLength(1)
    expect(subscribes()[0].args[0]).toEqual({ serverId: 's1' })
  })

  it('waits for the connection, then subscribes again after every reconnect', () => {
    renderHook(() => useServerSubscriptionViewModel('s1'))
    expect(subscribes()).toHaveLength(0)
    act(() => fakeSocket.receive('connect'))
    expect(subscribes()).toHaveLength(1)
    act(() => fakeSocket.receive('disconnect', 'transport close'))
    act(() => fakeSocket.receive('connect'))
    expect(subscribes()).toHaveLength(2)
  })

  it('exposes the presence fed by snapshot, updates and room events', () => {
    fakeSocket.connected = true
    const { result } = renderHook(() => useServerSubscriptionViewModel('s1'))
    act(() => fakeSocket.receive('presence:snapshot', snapshotS1))
    expect(result.current.onlineUserIds).toEqual(['u1', 'u2'])
    act(() => fakeSocket.receive('presence:update', { serverId: 's1', userId: 'u3', online: true }))
    expect(result.current.onlineUserIds).toEqual(['u1', 'u2', 'u3'])
    act(() => fakeSocket.receive('room:participants', { serverId: 's1', roomId: 'r1', participants: [] }))
    expect(result.current.rooms).toEqual([])
  })

  it('ignores events of another server', () => {
    fakeSocket.connected = true
    const { result } = renderHook(() => useServerSubscriptionViewModel('s1'))
    act(() => fakeSocket.receive('presence:snapshot', snapshotS2))
    expect(result.current.onlineUserIds).toEqual([])
  })

  it('does not break when the API refuses the subscription', () => {
    fakeSocket.connected = true
    fakeSocket.ackReply = { ok: false, error: { code: 'FORBIDDEN', message: 'no' } }
    expect(() => renderHook(() => useServerSubscriptionViewModel('s1'))).not.toThrow()
  })

  it('resubscribes when the server changes and clears everything on unmount', () => {
    fakeSocket.connected = true
    const { rerender, unmount } = renderHook(({ id }) => useServerSubscriptionViewModel(id), {
      initialProps: { id: 's1' },
    })
    act(() => fakeSocket.receive('presence:snapshot', snapshotS1))
    rerender({ id: 's2' })
    expect(subscribes().map((call) => call.args[0])).toEqual([{ serverId: 's1' }, { serverId: 's2' }])
    expect(usePresenceStore.getState().serverId).toBeNull()
    unmount()
    for (const event of ['presence:snapshot', 'presence:update', 'room:participants', 'connect']) {
      expect(fakeSocket.listenerCount(event)).toBe(0)
    }
  })
})
