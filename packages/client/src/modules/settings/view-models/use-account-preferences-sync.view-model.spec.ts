import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeLanguage = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { resolvedLanguage: 'en', language: 'en', changeLanguage } }),
}))
vi.mock('@/shared/lib/auth-client', async () => ({
  authClient: (await import('./test/fake-account-auth-client')).fakeAccountAuthClient,
}))
vi.mock('@/shared/lib/http', async () => ({
  http: (await import('./test/fake-settings-http')).fakeSettingsHttp,
}))

import { useThemeStore } from './stores/theme.store'
import { fakeAccountAuthClient } from './test/fake-account-auth-client'
import { fakeSettingsHttp } from './test/fake-settings-http'
import { sessionData, sessionUser } from './test/settings-seed'
import { createSettingsViewModelContext } from './test/settings-view-model-context'
import { useAccountPreferencesSyncViewModel } from './use-account-preferences-sync.view-model'

const setup = (user: Partial<typeof sessionUser> | null) => {
  const context = createSettingsViewModelContext(user ? { ...sessionData, user: { ...sessionUser, ...user } } : null)
  return { ...context, ...renderHook(() => useAccountPreferencesSyncViewModel(), { wrapper: context.wrapper }) }
}

describe('useAccountPreferencesSyncViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useThemeStore.setState({ theme: 'system', pendingAccountSync: false })
    fakeAccountAuthClient.getSession.mockResolvedValue({ data: sessionData, error: null })
    fakeSettingsHttp.patch.mockResolvedValue({ data: {} })
  })

  it('applies the account theme and locale', () => {
    setup({ theme: 'light', locale: 'pt' })
    expect(useThemeStore.getState().theme).toBe('light')
    expect(changeLanguage).toHaveBeenCalledWith('pt')
  })

  it('leaves the language alone when the account follows the browser', () => {
    setup({ theme: 'dark', locale: null })
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(changeLanguage).not.toHaveBeenCalled()
  })

  it('ignores values it does not know', () => {
    setup({ theme: 'sepia', locale: 'fr' })
    expect(useThemeStore.getState().theme).toBe('system')
    expect(changeLanguage).not.toHaveBeenCalled()
  })

  it('does nothing without a session', () => {
    setup(null)
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('applies once per user, so a later local choice is not overwritten', () => {
    const { rerender } = setup({ theme: 'light' })
    useThemeStore.setState({ theme: 'dark' })
    rerender()
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('sends a guest theme choice to the account after login', async () => {
    useThemeStore.setState({ theme: 'light', pendingAccountSync: true })
    setup({ theme: 'dark' })

    await waitFor(() => expect(fakeSettingsHttp.patch).toHaveBeenCalledWith('/me/preferences', { theme: 'light' }))
    await waitFor(() => expect(useThemeStore.getState().pendingAccountSync).toBe(false))
    expect(useThemeStore.getState().theme).toBe('light')
  })
})
