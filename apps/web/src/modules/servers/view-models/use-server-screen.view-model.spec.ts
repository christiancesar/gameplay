import { act, renderHook, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@/shared/lib/socket', async () => {
  const { fakeSocket } = await import('@/modules/realtime/view-models/test/fake-socket.instance')
  return { createSocket: () => fakeSocket }
})
vi.mock('@tanstack/react-router', async () => (await import('./test/fake-server-router')).fakeServerRouterModule)
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

import { fakeSocket } from '@/modules/realtime/view-models/test/fake-socket.instance'
import { usePresenceStore } from '@/modules/realtime/view-models/stores/presence.store'
import { useVoiceStore } from '@/modules/rooms/view-models/stores/voice.store'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'
import { navigate } from '@/shared/test/fake-router'

import { adminSession, memberSession } from '@/modules/hub/view-models/test/hub-seed'
import { memberDetail, serverDetail } from './test/server-screen-seed'
import { createServerScreenViewModelContext } from './test/server-screen-view-model-context'
import { joinedServer, ownedServer } from './test/servers-seed'
import { useServerScreenViewModel } from './use-server-screen.view-model'

type Setup = Parameters<typeof createServerScreenViewModelContext>[0]

const setup = (overrides: Partial<Setup> = {}) => {
  const context = createServerScreenViewModelContext({
    detail: serverDetail,
    servers: [ownedServer, joinedServer],
    session: adminSession,
    ...overrides,
  })
  const hook = renderHook(() => useServerScreenViewModel(), { wrapper: context.wrapper })
  return { ...hook, ...context }
}

const ready = async (result: { current: ReturnType<typeof useServerScreenViewModel> }) =>
  waitFor(() => {
    expect(result.current.isLoading).toBe(false)
    expect(result.current.members).toHaveLength(4)
  })

describe('useServerScreenViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakeSocket.reset()
    fakeSocket.connected = true
    usePresenceStore.getState().reset()
    useVoiceStore.setState({ connection: null })
  })

  it('is loading until the server detail arrives', async () => {
    const { result } = setup()
    expect(result.current.isLoading).toBe(true)
    await ready(result)
    expect(result.current.sidebar.server).toEqual({ name: 'Turbex', iconUrl: undefined })
    expect(result.current.sidebar.role).toBe('owner')
    expect(result.current.sidebar.rooms.map((room) => room.name)).toEqual(['Lobby', 'Raid'])
  })

  it('shows who is online and who is in each room from the live presence', async () => {
    const { result } = setup()
    await ready(result)
    act(() =>
      fakeSocket.receive('presence:snapshot', {
        serverId: 's1',
        onlineUserIds: ['u2'],
        rooms: [{ roomId: 'r1', participants: [{ userId: 'u2', muted: true, deafened: false, streaming: null }] }],
      }),
    )
    expect(result.current.members.find((member) => member.id === 'u2')?.isOnline).toBe(true)
    expect(result.current.members.find((member) => member.id === 'u1')?.isOnline).toBe(false)
    expect(result.current.sidebar.rooms[0].participants).toEqual([
      expect.objectContaining({ id: 'u2', name: 'ana', isMuted: true }),
    ])
  })

  it('takes the pending join requests from the server detail', async () => {
    const { result } = setup()
    await ready(result)
    expect(result.current.sidebar.pendingRequests).toBe(2)
    expect(fakeHttp.get).not.toHaveBeenCalledWith('/servers/s1/join-requests')
  })

  it('shows no pending requests to a plain member', async () => {
    const { result } = setup({ detail: memberDetail, session: memberSession })
    await ready(result)
    expect(result.current.sidebar.pendingRequests).toBe(0)
  })

  it('opens the server settings keeping the other search params', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.sidebar.onOpenServerSettings())
    const { search } = navigate.mock.calls[0][0]
    expect(search({ watch: 'u2' })).toEqual({ watch: 'u2', serverSettings: 'general' })
  })

  it('opens the profile settings and drops serverSettings and watch', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.userCard.onOpenSettings())
    expect(navigate).toHaveBeenCalledWith({ to: '.', search: { settings: 'profile' } })
  })

  it('goes back to the Hub without touching the voice connection', async () => {
    useVoiceStore.setState({ connection: { serverId: 's1', roomId: 'r1' } })
    const { result } = setup()
    await ready(result)
    act(() => result.current.sidebar.onBackToHub())
    expect(navigate).toHaveBeenCalledWith({ to: '/' })
    expect(useVoiceStore.getState().connection).toEqual({ serverId: 's1', roomId: 'r1' })
  })

  it('switches server right away when not connected to a room', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.sidebar.onSelectServer('s2'))
    expect(navigate).toHaveBeenCalledWith({ to: '/servers/$serverId', params: { serverId: 's2' } })
    expect(result.current.sidebar.pendingSwitch).toBeUndefined()
  })

  it('asks before switching while connected, then disconnects and switches on confirm', async () => {
    useVoiceStore.setState({ connection: { serverId: 's1', roomId: 'r2' } })
    const { result } = setup()
    await ready(result)
    act(() => result.current.sidebar.onSelectServer('s2'))
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.sidebar.pendingSwitch).toEqual({ serverName: 'Clan Zero', roomName: 'Raid' })

    act(() => result.current.sidebar.onConfirmSwitch())
    expect(useVoiceStore.getState().connection).toBeNull()
    expect(navigate).toHaveBeenCalledWith({ to: '/servers/$serverId', params: { serverId: 's2' } })
    expect(result.current.sidebar.pendingSwitch).toBeUndefined()
  })

  it('keeps the connection when the switch is dismissed', async () => {
    useVoiceStore.setState({ connection: { serverId: 's1', roomId: 'r2' } })
    const { result } = setup()
    await ready(result)
    act(() => result.current.sidebar.onSelectServer('s2'))
    act(() => result.current.sidebar.onDismissSwitch())
    expect(result.current.sidebar.pendingSwitch).toBeUndefined()
    expect(useVoiceStore.getState().connection).not.toBeNull()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('marks the connected room as current only on its own server', async () => {
    useVoiceStore.setState({ connection: { serverId: 's1', roomId: 'r1' } })
    const { result } = setup()
    await ready(result)
    expect(result.current.sidebar.currentRoomId).toBe('r1')
    expect(result.current.userCard.inRoom).toBe(true)
    act(() => useVoiceStore.setState({ connection: { serverId: 's2', roomId: 'x' } }))
    expect(result.current.sidebar.currentRoomId).toBeUndefined()
  })

  it('leaves the server, goes to the Hub and refreshes the list', async () => {
    const { result, queryClient } = setup()
    await ready(result)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const remove = vi.spyOn(queryClient, 'removeQueries')
    act(() => result.current.sidebar.onLeaveServer())
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true }))
    expect(fakeHttp.post).toHaveBeenCalledWith('/servers/s1/leave')
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: serversKeys.list() }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: serversKeys.myLimits() })
    expect(remove).toHaveBeenCalledWith({ queryKey: serversKeys.detail('s1') })
  })

  it('drops the voice connection of the server it leaves', async () => {
    useVoiceStore.setState({ connection: { serverId: 's1', roomId: 'r1' } })
    const { result } = setup({ detail: memberDetail, session: memberSession })
    await ready(result)
    act(() => result.current.sidebar.onLeaveServer())
    await waitFor(() => expect(useVoiceStore.getState().connection).toBeNull())
  })

  it('toasts and stays when leaving fails', async () => {
    const { result } = setup()
    await ready(result)
    fakeHttp.post.mockRejectedValue(new ApiError({ code: 'X', message: 'x' }, 500))
    act(() => result.current.sidebar.onLeaveServer())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('server.leaveFailed'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it.each([403, 404])('toasts and goes back to the Hub on %s', async (status) => {
    setup({ detail: new ApiError({ code: 'FORBIDDEN', message: 'no' }, status) })
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true }))
    expect(toast.error).toHaveBeenCalledWith('server.unavailable', { id: 'server-unavailable' })
  })

  it('exposes the profile of the session in the user card', async () => {
    const { result } = setup({ session: memberSession })
    expect(result.current.userCard.user).toEqual({
      name: 'Player',
      email: 'player@gameplay.local',
      avatarUrl: '/avatars/u2.webp',
    })
  })
})
