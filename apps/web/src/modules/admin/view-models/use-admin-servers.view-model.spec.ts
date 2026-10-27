import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock('@tanstack/react-router', async () => (await import('@/shared/test/fake-router')).fakeRouterModule)

import { toast } from 'sonner'

import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'
import { navigate, routerSearch } from '@/shared/test/fake-router'

import { adminServer } from './test/admin-seed'
import { createAdminViewModelContext } from './test/admin-view-model-context'
import { useAdminServersViewModel } from './use-admin-servers.view-model'

const setup = async (responses = {}) => {
  const context = createAdminViewModelContext(responses)
  const hook = renderHook(() => useAdminServersViewModel(), { wrapper: context.wrapper })
  await waitFor(() => expect(hook.result.current.serversTab.servers).toHaveLength(1))
  return { ...context, ...hook }
}

describe('useAdminServersViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists servers with owner and counts against the effective limits', async () => {
    const { result } = await setup()
    expect(result.current.serversTab.servers[0]).toMatchObject({
      id: 'sv1',
      ownerName: 'shinigame',
      members: { count: 6, limit: 10, isOverride: false },
      rooms: { count: 2, limit: 2, isOverride: false },
    })
  })

  it('searches on the server after the debounce', async () => {
    const { result } = await setup()
    act(() => result.current.serversTab.onSearchChange('tur'))
    await waitFor(() =>
      expect(fakeHttp.get).toHaveBeenCalledWith('/admin/servers', { params: { search: 'tur', pageSize: 100 } }),
    )
  })

  it('opens the members dialog with who invited each member', async () => {
    const { result } = await setup()
    act(() => result.current.serversTab.onViewMembers('sv1'))
    await waitFor(() => expect(result.current.membersDialog.members).toHaveLength(1))
    expect(result.current.membersDialog).toMatchObject({ open: true, serverName: 'Turbex' })
    expect(result.current.membersDialog.members[0]).toMatchObject({
      id: 'u2',
      joinedVia: { invitedBy: 'shinigame' },
    })
    expect(fakeHttp.get).toHaveBeenCalledWith('/admin/servers/sv1')
    act(() => result.current.membersDialog.onOpenChange(false))
    expect(result.current.membersDialog.open).toBe(false)
  })

  it('saves member and room limits, sending null for the default', async () => {
    const { result } = await setup()
    act(() => result.current.serversTab.onEditLimits('sv1'))
    expect(result.current.limitDialog.fields.map((field) => field.id)).toEqual(['maxMembers', 'maxRooms'])
    act(() => result.current.limitDialog.onSave({ maxMembers: 20, maxRooms: undefined }))
    await waitFor(() =>
      expect(fakeHttp.put).toHaveBeenCalledWith('/admin/servers/sv1/limits', { maxMembers: 20, maxRooms: null }),
    )
    await waitFor(() => expect(result.current.limitDialog.open).toBe(false))
  })

  it('prefills the limits dialog with the overrides the API reports', async () => {
    const custom = { ...adminServer, maxMembersOverride: 20, effectiveMaxMembers: 20 }
    const { result } = await setup({ servers: [custom] })
    expect(result.current.serversTab.servers[0].members).toEqual({ count: 6, limit: 20, isOverride: true })
    expect(result.current.serversTab.servers[0].rooms.isOverride).toBe(false)
    act(() => result.current.serversTab.onEditLimits('sv1'))
    expect(result.current.limitDialog.fields).toEqual([
      expect.objectContaining({ id: 'maxMembers', defaultValue: 10, override: 20 }),
      expect.objectContaining({ id: 'maxRooms', defaultValue: 2, override: undefined }),
    ])
  })

  it('deletes a server and refetches the list', async () => {
    const { result } = await setup()
    act(() => result.current.serversTab.onDelete('sv1'))
    await waitFor(() => expect(fakeHttp.delete).toHaveBeenCalledWith('/admin/servers/sv1'))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('admin.notices.serverDeleted'))
  })

  it('shows an error toast when the delete fails', async () => {
    const { result } = await setup()
    fakeHttp.delete.mockRejectedValueOnce(new ApiError({ code: 'SERVER_NOT_FOUND', message: 'x' }, 404))
    act(() => result.current.serversTab.onDelete('sv1'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('admin.errors.notFound'))
  })

  describe('media resources in "Adjust server"', () => {
    const openDialog = async () => {
      const context = await setup()
      act(() => context.result.current.serversTab.onEditLimits('sv1'))
      await waitFor(() => expect(context.result.current.limitDialog.media).toBeDefined())
      return context
    }

    it('starts from the global settings and the server overrides', async () => {
      const { result } = await openDialog()
      expect(result.current.limitDialog.media).toEqual({
        globals: { sfu: true, mesh: true, turn: true },
        choices: { sfu: 'global', mesh: 'global', turn: 'global' },
      })
    })

    it('saves straight away when nothing goes off', async () => {
      const { result } = await openDialog()
      act(() => result.current.limitDialog.onSave({}, { sfu: 'global', mesh: 'on', turn: 'global' }))
      await waitFor(() =>
        expect(fakeHttp.put).toHaveBeenCalledWith('/admin/servers/sv1/media', {
          overrides: { sfu: null, mesh: true, turn: null },
          notice: undefined,
        }),
      )
      expect(result.current.confirmDialog.open).toBe(false)
    })

    it('asks before turning something off, then sends the notice along', async () => {
      const { result } = await openDialog()
      act(() => result.current.limitDialog.onSave({}, { sfu: 'off', mesh: 'global', turn: 'off' }))
      expect(result.current.confirmDialog).toMatchObject({ open: true, resources: ['sfu', 'turn'], scope: 'server' })
      await waitFor(() => expect(result.current.confirmDialog.impact).toBe(4))
      expect(fakeHttp.put).not.toHaveBeenCalledWith('/admin/servers/sv1/media', expect.anything())

      const notice = { title: 'Off', message: 'Back soon.', audience: 'members' as const }
      act(() => result.current.confirmDialog.onConfirm(notice))
      await waitFor(() =>
        expect(fakeHttp.put).toHaveBeenCalledWith('/admin/servers/sv1/media', {
          overrides: { sfu: false, mesh: null, turn: false },
          notice,
        }),
      )
      await waitFor(() => expect(result.current.confirmDialog.open).toBe(false))
    })

    it('opens for the server the Media tab asked for', async () => {
      routerSearch.current = { edit: 'sv1' }
      try {
        const { result } = await setup()
        expect(result.current.limitDialog.open).toBe(true)
        act(() => result.current.limitDialog.onOpenChange(false))
        expect(navigate).toHaveBeenCalledWith({ to: '/admin/servers', search: {}, replace: true })
      } finally {
        routerSearch.current = {}
      }
    })
  })
})
