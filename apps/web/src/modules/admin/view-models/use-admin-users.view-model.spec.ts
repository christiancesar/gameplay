import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock(
  '@/modules/admin/model/services/browser.service',
  async () => (await import('./test/fake-browser')).fakeBrowserModule,
)

import { toast } from 'sonner'

import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'

import { useLimitOverridesStore } from './stores/limit-overrides.store'
import { createAdminViewModelContext } from './test/admin-view-model-context'
import { fakeBrowserModule } from './test/fake-browser'
import { useAdminUsersViewModel } from './use-admin-users.view-model'

const setup = async (responses = {}) => {
  const context = createAdminViewModelContext(responses)
  const hook = renderHook(() => useAdminUsersViewModel(), { wrapper: context.wrapper })
  // Users, then each user's sessions.
  await waitFor(() => expect(hook.result.current.usersTab.users[0]?.sessionCount).toBe(1))
  return { ...context, ...hook }
}

describe('useAdminUsersViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLimitOverridesStore.setState({ users: {}, servers: {} })
  })

  it('lists users with presence, session count, owned servers and the default limit', async () => {
    const { result } = await setup()
    const [kisnaider, marreta] = result.current.usersTab.users
    expect(kisnaider).toMatchObject({
      id: 'u1',
      name: 'Kisnaider',
      isOnline: true,
      sessionCount: 1,
      serversOwned: 1,
      serverLimit: { value: 1, isOverride: false },
    })
    expect(marreta).toMatchObject({ id: 'u2', isSuspended: true, sessionCount: 0, serversOwned: 0 })
  })

  it('searches on the server after the debounce', async () => {
    const { result } = await setup()
    act(() => result.current.usersTab.onSearchChange('kis'))
    expect(result.current.usersTab.search).toBe('kis')
    await waitFor(() =>
      expect(fakeHttp.get).toHaveBeenCalledWith('/admin/users', { params: { search: 'kis', pageSize: 100 } }),
    )
  })

  it('suspends and reactivates', async () => {
    const { result } = await setup()
    act(() => result.current.usersTab.onSuspend('u1'))
    await waitFor(() => expect(fakeHttp.post).toHaveBeenCalledWith('/admin/users/u1/suspend'))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('admin.notices.suspended'))
    act(() => result.current.usersTab.onReactivate('u2'))
    await waitFor(() => expect(fakeHttp.post).toHaveBeenCalledWith('/admin/users/u2/reactivate'))
  })

  it('ends every session of a user', async () => {
    const { result } = await setup()
    act(() => result.current.usersTab.onEndSessions('u1'))
    await waitFor(() => expect(fakeHttp.post).toHaveBeenCalledWith('/admin/users/u1/sessions/revoke'))
  })

  it('shows an error toast when the API refuses', async () => {
    const { result } = await setup()
    fakeHttp.post.mockRejectedValueOnce(new ApiError({ code: 'CANNOT_SUSPEND_SELF', message: 'x' }, 409))
    act(() => result.current.usersTab.onSuspend('u1'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('admin.errors.cannotSuspendSelf'))
  })

  it('opens the sessions dialog with the summarized sessions and closes it', async () => {
    const { result } = await setup()
    act(() => result.current.usersTab.onViewSessions('u1'))
    expect(result.current.sessionsDialog).toMatchObject({ open: true, userName: 'Kisnaider' })
    expect(result.current.sessionsDialog.sessions).toEqual([
      expect.objectContaining({ id: 's1', ip: '187.64.12.201', device: 'Chrome 141 · Windows' }),
    ])
    act(() => result.current.sessionsDialog.onOpenChange(false))
    expect(result.current.sessionsDialog.open).toBe(false)
  })

  it('ending one session revokes all sessions of that user', async () => {
    const { result } = await setup()
    act(() => result.current.usersTab.onViewSessions('u1'))
    act(() => result.current.sessionsDialog.onEndSession())
    await waitFor(() => expect(fakeHttp.post).toHaveBeenCalledWith('/admin/users/u1/sessions/revoke'))
  })

  it('resets the password with a suggested one and closes the dialog', async () => {
    const { result } = await setup()
    act(() => result.current.usersTab.onResetPassword('u1'))
    const { initialPassword } = result.current.resetPasswordDialog
    expect(result.current.resetPasswordDialog.open).toBe(true)
    expect(initialPassword).toHaveLength(16)
    act(() => result.current.resetPasswordDialog.onSubmit({ password: initialPassword }))
    await waitFor(() =>
      expect(fakeHttp.post).toHaveBeenCalledWith('/admin/users/u1/password', { password: initialPassword }),
    )
    await waitFor(() => expect(result.current.resetPasswordDialog.open).toBe(false))
    expect(toast.success).toHaveBeenCalledWith('admin.notices.passwordReset')
  })

  it('copies the password and generates a new one on request', async () => {
    const { result } = await setup()
    act(() => result.current.resetPasswordDialog.onCopy('secret-pass'))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('common.copied'))
    expect(fakeBrowserModule.copyText).toHaveBeenCalledWith('secret-pass')
    expect(result.current.resetPasswordDialog.onGenerate()).toHaveLength(16)
  })

  it('edits the server limit: default first, then the saved override', async () => {
    const { result } = await setup()
    act(() => result.current.usersTab.onEditLimit('u1'))
    expect(result.current.limitDialog.fields).toEqual([
      { id: 'maxServers', label: 'admin.users.serverLimit', defaultValue: 1, override: undefined },
    ])
    act(() => result.current.limitDialog.onSave({ maxServers: 3 }))
    await waitFor(() => expect(fakeHttp.put).toHaveBeenCalledWith('/admin/users/u1/limits', { maxServers: 3 }))
    await waitFor(() => expect(result.current.limitDialog.open).toBe(false))
    expect(result.current.usersTab.users[0].serverLimit).toEqual({ value: 3, isOverride: true })
  })

  it('goes back to the default by sending null', async () => {
    const { result } = await setup()
    act(() => result.current.usersTab.onEditLimit('u1'))
    act(() => result.current.limitDialog.onSave({ maxServers: undefined }))
    await waitFor(() => expect(fakeHttp.put).toHaveBeenCalledWith('/admin/users/u1/limits', { maxServers: null }))
  })

  it('opens the hardware dialog with the devices of that user', async () => {
    const { result } = await setup()
    act(() => result.current.usersTab.onViewHardware('u1'))
    await waitFor(() => expect(result.current.hardwareDialog.devices).toHaveLength(1))
    expect(result.current.hardwareDialog).toMatchObject({ open: true, userName: 'Kisnaider' })
    expect(result.current.hardwareDialog.devices[0]).toMatchObject({ id: 'd1', label: 'Windows 11 · Chrome 141' })
    act(() => result.current.hardwareDialog.onDeviceChange('d1'))
    expect(result.current.hardwareDialog.currentDeviceId).toBe('d1')
  })
})
