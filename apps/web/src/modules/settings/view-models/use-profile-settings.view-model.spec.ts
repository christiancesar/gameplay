import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({
  http: (await import('./test/fake-settings-http')).fakeSettingsHttp,
}))
vi.mock('@/shared/lib/auth-client', async () => ({
  authClient: (await import('./test/fake-account-auth-client')).fakeAccountAuthClient,
}))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

import { toast } from 'sonner'

import { ApiError } from '@/shared/lib/api-error'

import { fakeAccountAuthClient } from './test/fake-account-auth-client'
import { fakeSettingsHttp } from './test/fake-settings-http'
import { sessionData } from './test/settings-seed'
import { createSettingsViewModelContext } from './test/settings-view-model-context'
import { useProfileSettingsViewModel } from './use-profile-settings.view-model'

const file = (type: string, size: number) => {
  const value = new File(['x'], 'avatar', { type })
  Object.defineProperty(value, 'size', { value: size })
  return value
}

const setup = () => {
  const context = createSettingsViewModelContext()
  const invalidate = vi.spyOn(context.queryClient, 'invalidateQueries')
  return { invalidate, ...renderHook(() => useProfileSettingsViewModel(), { wrapper: context.wrapper }) }
}

describe('useProfileSettingsViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakeAccountAuthClient.getSession.mockResolvedValue({ data: sessionData, error: null })
  })

  it('exposes the user from the session', () => {
    const { result } = setup()
    expect(result.current.user).toEqual({
      name: 'Turbex',
      email: 'turbex@gameplay.local',
      avatarUrl: '/avatars/u1/old.webp',
    })
  })

  it('uploads a valid avatar and refreshes the session', async () => {
    fakeSettingsHttp.put.mockResolvedValue({ data: { image: '/avatars/u1/new.webp' } })
    const { result, invalidate } = setup()
    act(() => result.current.onSelectAvatar(file('image/png', 100)))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['session'], refetchType: 'all' }))
    expect(fakeSettingsHttp.put).toHaveBeenCalledWith('/me/avatar', expect.any(FormData))
    expect(result.current.avatarError).toBeUndefined()
  })

  it('refuses an invalid avatar without calling the API', () => {
    const { result } = setup()
    act(() => result.current.onSelectAvatar(file('image/gif', 100)))
    expect(result.current.avatarError).toBe('invalidType')
    act(() => result.current.onSelectAvatar(file('image/png', 3 * 1024 * 1024)))
    expect(result.current.avatarError).toBe('tooLarge')
    expect(fakeSettingsHttp.put).not.toHaveBeenCalled()
  })

  it('flags a failed upload', async () => {
    fakeSettingsHttp.put.mockRejectedValue(new ApiError({ code: 'UNKNOWN_ERROR', message: '' }, 500))
    const { result } = setup()
    act(() => result.current.onSelectAvatar(file('image/png', 100)))
    await waitFor(() => expect(result.current.avatarError).toBe('uploadFailed'))
  })

  it('removes the avatar and refreshes the session', async () => {
    fakeSettingsHttp.delete.mockResolvedValue({ data: undefined })
    const { result, invalidate } = setup()
    act(() => result.current.onRemoveAvatar())
    await waitFor(() => expect(invalidate).toHaveBeenCalled())
    expect(fakeSettingsHttp.delete).toHaveBeenCalledWith('/me/avatar')
  })

  it('changes the username and refreshes the session', async () => {
    fakeAccountAuthClient.updateUser.mockResolvedValue({ data: { status: true }, error: null })
    const { result, invalidate } = setup()
    act(() => result.current.onSaveUsername('NewName'))
    await waitFor(() => expect(invalidate).toHaveBeenCalled())
    expect(fakeAccountAuthClient.updateUser).toHaveBeenCalledWith({ username: 'NewName', displayUsername: 'NewName' })
    expect(result.current.usernameError).toBeUndefined()
  })

  it('reports a username that is taken as a field error', async () => {
    fakeAccountAuthClient.updateUser.mockResolvedValue({
      data: null,
      error: { code: 'USERNAME_IS_ALREADY_TAKEN', status: 400 },
    })
    const { result } = setup()
    act(() => result.current.onSaveUsername('taken'))
    await waitFor(() => expect(result.current.usernameError).toBe('usernameTaken'))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows a toast for any other username failure', async () => {
    fakeAccountAuthClient.updateUser.mockResolvedValue({ data: null, error: { status: 500 } })
    const { result } = setup()
    act(() => result.current.onSaveUsername('name'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('settings.errors.unexpected'))
    expect(result.current.usernameError).toBeUndefined()
  })

  it('changes the password, confirms it and bumps the form key', async () => {
    fakeAccountAuthClient.changePassword.mockResolvedValue({ data: {}, error: null })
    const { result } = setup()
    const key = result.current.formKey
    act(() => result.current.onChangePassword({ currentPassword: 'old-pass-1', newPassword: 'new-pass-1' }))
    await waitFor(() => expect(result.current.passwordChanged).toBe(true))
    expect(result.current.formKey).toBe(key + 1)
    expect(fakeAccountAuthClient.changePassword).toHaveBeenCalledWith(
      expect.objectContaining({ currentPassword: 'old-pass-1', newPassword: 'new-pass-1' }),
    )
  })

  it('flags a wrong current password and hides the previous confirmation', async () => {
    fakeAccountAuthClient.changePassword
      .mockResolvedValueOnce({ data: {}, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: 'INVALID_PASSWORD', status: 400 } })
    const { result } = setup()
    act(() => result.current.onChangePassword({ currentPassword: 'old-pass-1', newPassword: 'new-pass-1' }))
    await waitFor(() => expect(result.current.passwordChanged).toBe(true))
    act(() => result.current.onChangePassword({ currentPassword: 'wrong-pass', newPassword: 'new-pass-1' }))
    await waitFor(() => expect(result.current.passwordError).toBe('invalidPassword'))
    expect(result.current.passwordChanged).toBe(false)
  })
})
