import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeLanguage = vi.fn()
let resolvedLanguage = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage, language: resolvedLanguage, changeLanguage },
  }),
}))
vi.mock('@/shared/lib/http', async () => ({
  http: (await import('./test/fake-settings-http')).fakeSettingsHttp,
}))
vi.mock('@/shared/lib/auth-client', async () => ({
  authClient: (await import('./test/fake-account-auth-client')).fakeAccountAuthClient,
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

import { toast } from 'sonner'

import { ApiError } from '@/shared/lib/api-error'

import { useThemeStore } from './stores/theme.store'
import { fakeAccountAuthClient } from './test/fake-account-auth-client'
import { fakeSettingsHttp } from './test/fake-settings-http'
import { sessionData, sessionUser } from './test/settings-seed'
import { createSettingsViewModelContext } from './test/settings-view-model-context'
import { useAppearanceSettingsViewModel } from './use-appearance-settings.view-model'

const setup = (user: Partial<typeof sessionUser> = {}) => {
  const context = createSettingsViewModelContext({ ...sessionData, user: { ...sessionUser, ...user } })
  const invalidate = vi.spyOn(context.queryClient, 'invalidateQueries')
  return { invalidate, ...renderHook(() => useAppearanceSettingsViewModel(), { wrapper: context.wrapper }) }
}

describe('useAppearanceSettingsViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolvedLanguage = 'en'
    useThemeStore.setState({ theme: 'dark' })
    fakeSettingsHttp.patch.mockResolvedValue({ data: {} })
    fakeAccountAuthClient.getSession.mockResolvedValue({ data: sessionData, error: null })
  })

  it('shows the stored theme and the account language (null when it follows the browser)', () => {
    expect(setup().result.current).toMatchObject({ theme: 'dark', language: null })
    expect(setup({ locale: 'pt' }).result.current.language).toBe('pt')
  })

  it('treats the system theme as dark for the toggle', () => {
    useThemeStore.setState({ theme: 'system' })
    expect(setup().result.current.theme).toBe('dark')
  })

  it('applies the theme at once, saves it and refreshes the session', async () => {
    const { result, invalidate } = setup()
    act(() => result.current.onThemeChange('light'))
    expect(useThemeStore.getState().theme).toBe('light')
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['session'], refetchType: 'all' }))
    expect(fakeSettingsHttp.patch).toHaveBeenCalledWith('/me/preferences', { theme: 'light' })
  })

  it('applies the language at once, saves it and shows the saved language after the refresh', async () => {
    fakeAccountAuthClient.getSession.mockResolvedValue({
      data: { ...sessionData, user: { ...sessionUser, locale: 'pt' } },
      error: null,
    })
    const { result } = setup()
    act(() => result.current.onLanguageChange('pt'))
    expect(changeLanguage).toHaveBeenCalledWith('pt')
    await waitFor(() => expect(result.current.language).toBe('pt'))
    await waitFor(() => expect(fakeSettingsHttp.patch).toHaveBeenCalledWith('/me/preferences', { locale: 'pt' }))
  })

  it('saves null and applies the browser language when set back to automatic', async () => {
    vi.stubGlobal('navigator', { languages: ['pt-BR', 'en'] })
    const { result } = setup({ locale: 'en' })
    act(() => result.current.onLanguageChange(null))
    expect(changeLanguage).toHaveBeenCalledWith('pt')
    await waitFor(() => expect(fakeSettingsHttp.patch).toHaveBeenCalledWith('/me/preferences', { locale: null }))
    vi.unstubAllGlobals()
  })

  it('ignores unsupported languages', () => {
    const { result } = setup()
    act(() => result.current.onLanguageChange('fr'))
    expect(fakeSettingsHttp.patch).not.toHaveBeenCalled()
  })

  it('puts the previous theme and language back when the save fails', async () => {
    fakeSettingsHttp.patch.mockRejectedValue(new ApiError({ code: 'UNKNOWN_ERROR', message: '' }, 500))
    const { result } = setup()
    act(() => result.current.onThemeChange('light'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('settings.errors.unexpected'))
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(changeLanguage).toHaveBeenLastCalledWith('en')
  })
})
