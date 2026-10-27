import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeLanguage = vi.fn()
let resolvedLanguage: string | undefined = 'pt'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { resolvedLanguage, language: 'en', changeLanguage } }),
}))

import { useLanguageViewModel } from './use-language.view-model'

describe('useLanguageViewModel', () => {
  beforeEach(() => {
    changeLanguage.mockClear()
    resolvedLanguage = 'pt'
  })

  it('exposes the current language and the options', () => {
    const { result } = renderHook(() => useLanguageViewModel())
    expect(result.current.language).toBe('pt')
    expect(result.current.languageOptions).toEqual([
      { value: 'en', label: 'EN' },
      { value: 'pt', label: 'PT' },
    ])
  })

  it('falls back to en for an unsupported language', () => {
    resolvedLanguage = 'fr'
    const { result } = renderHook(() => useLanguageViewModel())
    expect(result.current.language).toBe('en')
  })

  it('changes the language only for supported values', () => {
    const { result } = renderHook(() => useLanguageViewModel())
    act(() => result.current.setLanguage('en'))
    act(() => result.current.setLanguage('fr'))
    expect(changeLanguage).toHaveBeenCalledTimes(1)
    expect(changeLanguage).toHaveBeenCalledWith('en')
  })
})
