import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigate = vi.fn()
let pathname = '/admin/users'

vi.mock('@tanstack/react-router', () => ({
  useLocation: ({ select }: { select: (location: { pathname: string }) => string }) => select({ pathname }),
  useNavigate: () => navigate,
}))
vi.mock('@/modules/settings/view-models/use-appearance-settings.view-model', () => ({
  useAppearanceSettingsViewModel: () => ({
    theme: 'dark',
    language: 'en',
    languageOptions: [
      { value: 'en', label: 'EN' },
      { value: 'pt', label: 'PT' },
    ],
    onThemeChange: vi.fn(),
    onLanguageChange: vi.fn(),
  }),
}))
vi.mock('@/modules/settings/view-models/use-language.view-model', () => ({
  useLanguageViewModel: () => ({
    language: 'en',
    languageOptions: [
      { value: 'en', label: 'EN' },
      { value: 'pt', label: 'PT' },
    ],
    setLanguage: vi.fn(),
  }),
}))

import { useAdminPanelViewModel } from './use-admin-panel.view-model'

describe('useAdminPanelViewModel', () => {
  beforeEach(() => {
    navigate.mockClear()
    pathname = '/admin/users'
  })

  it('reads the active tab from the pathname', () => {
    pathname = '/admin/hardware'
    const { result } = renderHook(() => useAdminPanelViewModel())
    expect(result.current.tab).toBe('hardware')
  })

  it('falls back to users on an unknown segment', () => {
    pathname = '/admin'
    const { result } = renderHook(() => useAdminPanelViewModel())
    expect(result.current.tab).toBe('users')
  })

  it('navigates to the chosen tab', () => {
    const { result } = renderHook(() => useAdminPanelViewModel())
    act(() => result.current.onTabChange('keys'))
    expect(navigate).toHaveBeenCalledWith({ to: '/admin/keys' })
  })

  it('navigates to the hub', () => {
    const { result } = renderHook(() => useAdminPanelViewModel())
    act(() => result.current.onBackToHub())
    expect(navigate).toHaveBeenCalledWith({ to: '/hub' })
  })
})
