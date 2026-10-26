import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({
  http: (await import('@/shared/test/fake-http')).fakeHttp,
}))
vi.mock('@/shared/lib/socket', async () => {
  const { fakeSocket } = await import('@/modules/realtime/view-models/test/fake-socket.instance')
  return { createSocket: () => fakeSocket }
})
vi.mock('@tanstack/react-router', async () => (await import('./test/fake-server-router')).fakeServerRouterModule)
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('@/modules/screen-share/view-models/share.controller', async () => ({
  shareController: (await import('@/modules/screen-share/view-models/test/fake-share-controller')).fakeShareController,
}))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

import { fakeShareController } from '@/modules/screen-share/view-models/test/fake-share-controller'
import { fakeSocket } from '@/modules/realtime/view-models/test/fake-socket.instance'
import { usePresenceStore } from '@/modules/realtime/view-models/stores/presence.store'
import { useVoiceStore } from '@/modules/rooms/view-models/stores/voice.store'
import { voiceController } from '@/modules/rooms/view-models/voice.controller'
import { idleVoice } from '@/modules/rooms/model/entities/voice-state'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'
import { navigate } from '@/shared/test/fake-router'

import { search } from './test/fake-server-router'
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
  afterEach(cleanup)
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    fakeSocket.reset()
    fakeSocket.connected = true
    usePresenceStore.getState().reset()
    useVoiceStore.setState({ ...idleVoice })
    delete search.watch
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
        rooms: [
          {
            roomId: 'r1',
            participants: [{ userId: 'u2', muted: true, deafened: false, streaming: null }],
          },
        ],
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
    expect(result.current.sidebar.pendingSwitch).toEqual({
      serverName: 'Clan Zero',
      roomName: 'Raid',
    })

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
  describe('voice', () => {
    it('joins the room that was clicked, on the server on screen', async () => {
      const join = vi.spyOn(voiceController, 'join').mockResolvedValue()
      const { result } = setup()
      await ready(result)
      act(() => result.current.sidebar.onSelectRoom('r2'))
      expect(join).toHaveBeenCalledWith('s1', 'r2')
    })

    it('asks before joining a room here while connected on another server, then joins on confirm', async () => {
      const join = vi.spyOn(voiceController, 'join').mockResolvedValue()
      useVoiceStore.setState({ connection: { serverId: 's2', roomId: 'x1' } })
      const { result } = setup()
      await ready(result)
      act(() => result.current.sidebar.onSelectRoom('r2'))
      expect(join).not.toHaveBeenCalled()
      expect(result.current.sidebar.pendingSwitch).toBeDefined()

      act(() => result.current.sidebar.onConfirmSwitch())
      expect(join).toHaveBeenCalledWith('s1', 'r2')
      // Stays on this server: no navigation to another one.
      expect(navigate).not.toHaveBeenCalledWith(expect.objectContaining({ to: '/servers/$serverId' }))
      expect(result.current.sidebar.pendingSwitch).toBeUndefined()
    })

    it('wires mute, deafen and leaving to the call and shows their state', async () => {
      const mute = vi.spyOn(voiceController, 'toggleMute').mockImplementation(() => undefined)
      const deafen = vi.spyOn(voiceController, 'toggleDeafen').mockImplementation(() => undefined)
      const leave = vi.spyOn(voiceController, 'leave').mockResolvedValue()
      const { result } = setup()
      await ready(result)
      act(() => result.current.userCard.onToggleMute())
      act(() => result.current.userCard.onToggleDeafen())
      act(() => result.current.userCard.onLeaveRoom())
      expect([mute, deafen, leave].map((spy) => spy.mock.calls.length)).toEqual([1, 1, 1])
      act(() => useVoiceStore.setState({ muted: false, deafened: true }))
      expect(result.current.userCard).toMatchObject({ isMuted: true, isDeafened: true })
    })

    it('has no stage outside a call or on another server than the one connected', async () => {
      const { result } = setup()
      await ready(result)
      expect(result.current.stage).toBeNull()
      act(() => useVoiceStore.setState({ connection: { serverId: 's2', roomId: 'x' } }))
      expect(result.current.stage).toBeNull()
    })

    it('shows the room stage with the people in the call, who is talking and the volumes', async () => {
      act(() =>
        useVoiceStore.setState({
          connection: { serverId: 's1', roomId: 'r2' },
          micDenied: true,
          participants: [
            { userId: 'u1', muted: false, deafened: false, streaming: null },
            { userId: 'u2', muted: true, deafened: false, streaming: null },
          ],
          peers: { u2: 'connected' },
          speaking: { u2: true },
          volumes: { u2: 70 },
        }),
      )
      const { result } = setup({
        session: { user: { id: 'u1', name: 'Turbex', email: 't@x.io', image: null } },
      })
      await ready(result)
      expect(result.current.stage).toMatchObject({ roomName: 'Raid', micDenied: true })
      expect(result.current.stage?.participants).toEqual([
        expect.objectContaining({ id: 'u1', isMe: true, connection: 'connected' }),
        expect.objectContaining({
          id: 'u2',
          isMuted: true,
          isSpeaking: true,
          volume: 70,
          connection: 'connected',
        }),
      ])
    })

    it('sends the volume chosen in the stage to the call', async () => {
      const setVolume = vi.spyOn(voiceController, 'setVolume').mockImplementation(() => undefined)
      useVoiceStore.setState({ connection: { serverId: 's1', roomId: 'r2' } })
      const { result } = setup()
      await ready(result)
      act(() => result.current.stage?.onVolumeChange('u2', 120))
      expect(setVolume).toHaveBeenCalledWith('u2', 120)
    })

    it('marks who is speaking in the sidebar rooms', async () => {
      const { result } = setup()
      await ready(result)
      act(() => {
        fakeSocket.receive('presence:snapshot', {
          serverId: 's1',
          onlineUserIds: ['u2'],
          rooms: [
            {
              roomId: 'r1',
              participants: [{ userId: 'u2', muted: false, deafened: false, streaming: null }],
            },
          ],
        })
        useVoiceStore.setState({ speaking: { u2: true } })
      })
      expect(result.current.sidebar.rooms[0].participants[0].isSpeaking).toBe(true)
    })
  })

  describe('watching a screen', () => {
    const inCall = (streaming: 'u2' | null) =>
      useVoiceStore.setState({
        connection: { serverId: 's1', roomId: 'r2' },
        status: 'connected',
        participants: [
          { userId: 'u1', muted: false, deafened: false, streaming: null },
          { userId: 'u2', muted: false, deafened: false, streaming: streaming ? '1080p60' : null },
          { userId: 'u4', muted: false, deafened: false, streaming: streaming ? '720p30' : null },
        ],
      })
    const session = { user: { id: 'u1', name: 'Turbex', email: 't@x.io', image: null } }

    it('has no watch view without ?watch=', async () => {
      inCall('u2')
      const { result } = setup({ session })
      await ready(result)
      expect(result.current.watch).toBeNull()
      expect(fakeShareController.watch).not.toHaveBeenCalled()
      expect(fakeShareController.stopWatching).toHaveBeenCalled()
    })

    it('asks to watch from the stage by putting the person in the URL', async () => {
      inCall('u2')
      const { result } = setup({ session })
      await ready(result)
      act(() => result.current.stage?.onWatch('u2'))
      const { search: change, replace } = navigate.mock.calls[0][0]
      expect(change({ serverSettings: 'rooms' })).toEqual({ serverSettings: 'rooms', watch: 'u2' })
      expect(replace).toBe(false)
    })

    it('shows the screen of the person in ?watch= with the others who are live to switch to', async () => {
      inCall('u2')
      search.watch = 'u2'
      const { result } = setup({ session })
      await ready(result)
      expect(fakeShareController.watch).toHaveBeenCalledWith('u2')
      expect(result.current.watch).toMatchObject({
        streamerName: 'ana',
        currentStreamId: 'u2',
        liveStreams: [
          { id: 'u2', name: 'ana' },
          { id: 'u4', name: 'carlos' },
        ],
      })
      expect(result.current.watch?.participants).toHaveLength(3)
    })

    it('switches and stops watching through the URL', async () => {
      inCall('u2')
      search.watch = 'u2'
      const { result } = setup({ session })
      await ready(result)
      act(() => result.current.watch?.onSwitchStream('u4'))
      expect(navigate.mock.calls[0][0].search({ watch: 'u2' })).toEqual({ watch: 'u4' })
      act(() => result.current.watch?.onStopWatching())
      const close = navigate.mock.calls[1][0]
      expect(close.search({ watch: 'u4' })).toEqual({ watch: undefined })
      expect(close.replace).toBe(true)
    })

    it('closes the view when the person stops sharing', async () => {
      inCall('u2')
      search.watch = 'u2'
      const { result } = setup({ session })
      await ready(result)
      navigate.mockClear()
      act(() => inCall(null))
      expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ replace: true }))
      expect(result.current.watch).toBeNull()
    })

    it('does not show a screen while the call is on another server', async () => {
      useVoiceStore.setState({ connection: { serverId: 's2', roomId: 'x' }, status: 'connected' })
      search.watch = 'u2'
      const { result } = setup({ session })
      await ready(result)
      expect(result.current.watch).toBeNull()
      expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ replace: true }))
    })

    it('gives the names of the members for the viewers list of the share panel', async () => {
      const { result } = setup({ session })
      await ready(result)
      expect(result.current.viewerProfiles.u2).toEqual({ name: 'ana', avatarUrl: undefined })
    })
  })
})
