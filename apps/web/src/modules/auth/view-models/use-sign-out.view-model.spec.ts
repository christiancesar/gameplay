import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/auth-client', async () => ({
  authClient: (await import('./test/fake-auth-client')).fakeAuthClient,
}))
vi.mock('@/shared/lib/socket', async () => {
  const { fakeSocket } = await import('@/modules/realtime/view-models/test/fake-socket.instance')
  return { createSocket: () => fakeSocket }
})
vi.mock('@tanstack/react-router', async () => (await import('./test/fake-router')).fakeRouterModule)

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

import { fakeSocket } from '@/modules/realtime/view-models/test/fake-socket.instance'

import { fakeAuthClient } from './test/fake-auth-client'
import { navigate } from './test/fake-router'
import { useSignOutViewModel } from './use-sign-out.view-model'

describe('useSignOutViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakeSocket.reset()
  })

  const setup = () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['session'], { user: { id: 'u1' } })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)
    return { queryClient, ...renderHook(() => useSignOutViewModel(), { wrapper }) }
  }

  it('signs out, clears the cache and goes to /sign-in with replace', async () => {
    fakeAuthClient.signOut.mockResolvedValue({ data: { success: true }, error: null })
    const { result, queryClient } = setup()
    act(() => result.current.signOut())
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', replace: true }))
    expect(queryClient.getQueryData(['session'])).toBeUndefined()
  })

  it('closes the realtime socket', async () => {
    fakeAuthClient.signOut.mockResolvedValue({ data: { success: true }, error: null })
    const { result } = setup()
    act(() => result.current.signOut())
    await waitFor(() => expect(navigate).toHaveBeenCalled())
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1)
  })

  it('closes the realtime socket even when the request fails', async () => {
    fakeAuthClient.signOut.mockRejectedValue(new Error('offline'))
    const { result } = setup()
    act(() => result.current.signOut())
    await waitFor(() => expect(navigate).toHaveBeenCalled())
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1)
  })

  it('clears local state even when the request fails', async () => {
    fakeAuthClient.signOut.mockRejectedValue(new Error('offline'))
    const { result, queryClient } = setup()
    act(() => result.current.signOut())
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', replace: true }))
    expect(queryClient.getQueryData(['session'])).toBeUndefined()
  })

  it('exposes isSigningOut while pending', async () => {
    let finish: (value: unknown) => void = () => {}
    fakeAuthClient.signOut.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { result } = setup()
    expect(result.current.isSigningOut).toBe(false)
    act(() => result.current.signOut())
    await waitFor(() => expect(result.current.isSigningOut).toBe(true))
    finish({ data: null, error: null })
    await waitFor(() => expect(result.current.isSigningOut).toBe(false))
  })
})
