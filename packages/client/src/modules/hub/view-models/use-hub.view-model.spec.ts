import type { MyLimits } from '@gameplay/contracts'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@tanstack/react-router', async () => (await import('@/shared/test/fake-router')).fakeRouterModule)

import { useThemeStore } from '@/modules/settings/view-models/stores/theme.store'
import { joinedServer, limitsReached, ownedServer } from '@/modules/servers/view-models/test/servers-seed'
import { fakeHttp } from '@/shared/test/fake-http'
import { navigate } from '@/shared/test/fake-router'

import { adminSession, memberSession } from './test/hub-seed'
import { createHubViewModelContext } from './test/hub-view-model-context'
import { useHubViewModel } from './use-hub.view-model'

const setup = (session: object, servers = [ownedServer, joinedServer], limits?: MyLimits) => {
  const context = createHubViewModelContext(session, servers, limits)
  return renderHook(() => useHubViewModel(), { wrapper: context.wrapper })
}

describe('useHubViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useThemeStore.setState({ theme: 'dark' })
    fakeHttp.patch.mockResolvedValue({ data: {} })
  })

  it('exposes the profile from the session', () => {
    const { result } = setup(memberSession)
    expect(result.current.user).toEqual({
      name: 'Player',
      email: 'player@gameplay.local',
      avatarUrl: '/avatars/u2.webp',
    })
  })

  it('loads the servers of the user in the View shape', async () => {
    const { result } = setup(adminSession)
    expect(result.current.isLoadingServers).toBe(true)
    await waitFor(() => expect(result.current.isLoadingServers).toBe(false))
    expect(result.current.servers).toEqual([
      { id: 's1', name: 'Turbex', iconUrl: undefined },
      { id: 's2', name: 'Clan Zero', iconUrl: '/icons/s2.webp' },
    ])
  })

  it('flags only the platform admin', () => {
    expect(setup(adminSession).result.current.isPlatformAdmin).toBe(true)
    expect(setup(memberSession).result.current.isPlatformAdmin).toBe(false)
  })

  it('allows creating while the limits load and while there is room', async () => {
    const { result } = setup(memberSession)
    expect(result.current.canCreateServer).toBe(true)
    await waitFor(() => expect(fakeHttp.get).toHaveBeenCalledWith('/me/limits'))
    await waitFor(() => expect(result.current.isLoadingServers).toBe(false))
    expect(result.current.canCreateServer).toBe(true)
  })

  it('blocks creating when GET /me/limits says the limit is reached', async () => {
    const { result } = setup(memberSession, [ownedServer], limitsReached)
    await waitFor(() => expect(result.current.canCreateServer).toBe(false))
  })

  it('toggles and persists the theme', async () => {
    const { result } = setup(adminSession)
    expect(result.current.theme).toBe('dark')
    act(() => result.current.onToggleTheme())
    await waitFor(() => expect(fakeHttp.patch).toHaveBeenCalledWith('/me/preferences', { theme: 'light' }))
    expect(useThemeStore.getState().theme).toBe('light')
    expect(result.current.theme).toBe('light')
    act(() => result.current.onToggleTheme())
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('resolves the system theme from the OS preference', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
    useThemeStore.setState({ theme: 'system' })
    const { result } = setup(adminSession)
    expect(result.current.theme).toBe('light')
  })

  it('navigates to a server, the admin panel and the settings modal', () => {
    const { result } = setup(adminSession)
    act(() => result.current.onOpenServer('s1'))
    expect(navigate).toHaveBeenLastCalledWith({ to: '/servers/$serverId', params: { serverId: 's1' } })
    act(() => result.current.onOpenAdmin())
    expect(navigate).toHaveBeenLastCalledWith({ to: '/admin' })
    act(() => result.current.onOpenSettings())
    const call = navigate.mock.calls.at(-1)?.[0]
    expect(call.to).toBe('.')
    expect(call.search({ other: 1 })).toEqual({ other: 1, settings: 'profile' })
  })

  it('hides the public home shortcut on desktop', () => {
    const context = createHubViewModelContext(adminSession, [], undefined, 'desktop')
    const { result } = renderHook(() => useHubViewModel(), { wrapper: context.wrapper })
    expect(result.current.showPublicHome).toBe(false)
  })
})
