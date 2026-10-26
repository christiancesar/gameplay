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

import { usePresenceStore } from '@/modules/realtime/view-models/stores/presence.store'
import { ApiError } from '@/shared/lib/api-error'

import { createServerSettingsViewModelContext } from './test/server-settings-view-model-context'
import { settingsHttp } from './test/server-settings-http'
import { lobbyOccupancy, settingsDetail } from './test/server-settings-seed'
import { useServerSettingsRoomsViewModel } from './use-server-settings-rooms.view-model'

const setup = () => {
  const context = createServerSettingsViewModelContext({ detail: settingsDetail })
  const hook = renderHook(() => useServerSettingsRoomsViewModel('s1'), { wrapper: context.wrapper })
  return { ...hook, ...context }
}

const ready = async (result: { current: ReturnType<typeof useServerSettingsRoomsViewModel> }) =>
  waitFor(() => {
    expect(result.current.isLoading).toBe(false)
    expect(result.current.rooms).toHaveLength(2)
  })

describe('useServerSettingsRoomsViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePresenceStore.getState().reset()
  })

  it('lists rooms by position with the limit', async () => {
    const { result } = setup()
    await ready(result)
    expect(result.current.rooms.map((room) => room.name)).toEqual(['Lobby', 'Raid'])
    expect(result.current.roomLimit).toBe(2)
  })

  it('counts occupants from the presence store of this server only', async () => {
    const { result } = setup()
    await ready(result)
    act(() => usePresenceStore.getState().applySnapshot({ serverId: 's1', onlineUserIds: [], rooms: [lobbyOccupancy] }))
    expect(result.current.rooms[0]?.occupants).toBe(2)
    act(() => usePresenceStore.getState().applySnapshot({ serverId: 's2', onlineUserIds: [], rooms: [lobbyOccupancy] }))
    expect(result.current.rooms[0]?.occupants).toBe(0)
  })

  it('creates a room and refreshes the server', async () => {
    const { result, queryClient } = setup()
    await ready(result)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    act(() => result.current.onCreate('Chill'))
    await waitFor(() => expect(settingsHttp.post).toHaveBeenCalledWith('/servers/s1/rooms', { name: 'Chill' }))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['servers', 'detail', 's1'] }))
  })

  it('toasts the API error when the room limit was reached meanwhile', async () => {
    const { result } = setup()
    await ready(result)
    settingsHttp.post.mockRejectedValueOnce(new ApiError({ code: 'ROOM_LIMIT_REACHED', message: 'limit' }, 409))
    act(() => result.current.onCreate('Chill'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.roomLimitReached'))
  })

  it('renames a room and leaves edit mode', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onStartRename('r1'))
    expect(result.current.editingRoomId).toBe('r1')
    act(() => result.current.onRename('r1', 'Hall'))
    await waitFor(() => expect(settingsHttp.patch).toHaveBeenCalledWith('/servers/s1/rooms/r1', { name: 'Hall' }))
    await waitFor(() => expect(result.current.editingRoomId).toBeUndefined())
  })

  it('keeps edit mode when the rename fails, and cancel leaves it', async () => {
    const { result } = setup()
    await ready(result)
    settingsHttp.patch.mockRejectedValueOnce(new ApiError({ code: 'ROOM_NAME_TAKEN', message: 'taken' }, 409))
    act(() => result.current.onStartRename('r1'))
    act(() => result.current.onRename('r1', 'Raid'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.roomNameTaken'))
    expect(result.current.editingRoomId).toBe('r1')
    act(() => result.current.onRenameCancel())
    expect(result.current.editingRoomId).toBeUndefined()
  })

  it('deletes a room', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onDelete('r2'))
    await waitFor(() => expect(settingsHttp.delete).toHaveBeenCalledWith('/servers/s1/rooms/r2'))
  })

  it('sends every room id in the new order when moving', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onMove('r2', 'up'))
    await waitFor(() =>
      expect(settingsHttp.put).toHaveBeenCalledWith('/servers/s1/rooms/order', { roomIds: ['r2', 'r1'] }),
    )
  })

  it('ignores a move past the end', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onMove('r1', 'up'))
    expect(settingsHttp.put).not.toHaveBeenCalled()
  })
})
