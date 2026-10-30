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

import { ApiError } from '@/shared/lib/api-error'
import { navigate } from '@/shared/test/fake-router'

import { createServerSettingsViewModelContext } from './test/server-settings-view-model-context'
import { settingsHttp } from './test/server-settings-http'
import { adminDetail, settingsDetail } from './test/server-settings-seed'
import { useServerSettingsDangerViewModel } from './use-server-settings-danger.view-model'

const setup = (detail = settingsDetail) => {
  const context = createServerSettingsViewModelContext({ detail })
  const hook = renderHook(() => useServerSettingsDangerViewModel('s1'), { wrapper: context.wrapper })
  return { ...hook, ...context }
}

const ready = async (result: { current: ReturnType<typeof useServerSettingsDangerViewModel> }) =>
  waitFor(() => expect(result.current.role).toBeDefined())

describe('useServerSettingsDangerViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exposes the role and the server name for the typed confirmation', async () => {
    const { result } = setup(adminDetail)
    await ready(result)
    expect(result.current).toMatchObject({ role: 'admin', serverName: 'Turbex', isBusy: false })
  })

  it('leaves the server, goes home and refreshes the list and the limits', async () => {
    const { result, queryClient } = setup(adminDetail)
    await ready(result)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    act(() => result.current.onLeave())
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/hub', replace: true }))
    expect(settingsHttp.post).toHaveBeenCalledWith('/servers/s1/leave')
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['servers', 'my-limits'] }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['servers', 'list'] })
  })

  it('deletes the server as the owner and goes home', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onDelete())
    await waitFor(() => expect(settingsHttp.delete).toHaveBeenCalledWith('/servers/s1'))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/hub', replace: true }))
  })

  it('stays put and toasts when the call fails', async () => {
    const { result } = setup()
    await ready(result)
    settingsHttp.delete.mockRejectedValueOnce(new ApiError({ code: 'SERVER_PERMISSION_DENIED', message: 'no' }, 403))
    act(() => result.current.onDelete())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.permissionDenied'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('has no role for a plain member', async () => {
    const { result } = setup({ ...settingsDetail, role: 'member' })
    await act(async () => undefined)
    await waitFor(() => expect(result.current.serverName).toBe('Turbex'))
    expect(result.current.role).toBeUndefined()
  })
})
