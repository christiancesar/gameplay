import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', async () => (await import('./test/fake-settings-router')).fakeSettingsRouterModule)

import { navigate, search } from './test/fake-settings-router'
import { createSettingsViewModelContext } from './test/settings-view-model-context'
import { useUserSettingsViewModel } from './use-user-settings.view-model'

const setup = () => {
  const context = createSettingsViewModelContext()
  return renderHook(() => useUserSettingsViewModel(), { wrapper: context.wrapper })
}

/** Runs the `search` updater the ViewModel passed to navigate. */
const nextSearch = (previous: Record<string, unknown>) => {
  const { search: update } = navigate.mock.calls.at(-1)![0] as {
    search: (previous: Record<string, unknown>) => Record<string, unknown>
  }
  return update(previous)
}

describe('useUserSettingsViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete search.settings
  })

  it('is closed without ?settings and defaults to the profile section', () => {
    const { result } = setup()
    expect(result.current.open).toBe(false)
    expect(result.current.section).toBe('profile')
  })

  it('opens on the section named in the URL and shows the display username', () => {
    search.settings = 'audio'
    const { result } = setup()
    expect(result.current.open).toBe(true)
    expect(result.current.section).toBe('audio')
    expect(result.current.userName).toBe('Turbex')
  })

  it('closing removes the param and keeps the other search params', () => {
    search.settings = 'audio'
    const { result } = setup()
    result.current.onOpenChange(false)
    expect(navigate.mock.calls[0]![0]).toMatchObject({ to: '.', replace: true })
    expect(nextSearch({ settings: 'audio', watch: 'u2' })).toEqual({ settings: undefined, watch: 'u2' })
  })

  it('changing section replaces the param', () => {
    search.settings = 'profile'
    const { result } = setup()
    result.current.onSectionChange('hardware')
    expect(navigate.mock.calls[0]![0]).toMatchObject({ replace: true })
    expect(nextSearch({ settings: 'profile' })).toEqual({ settings: 'hardware' })
  })

  it('does nothing when asked to open (the URL opens it)', () => {
    const { result } = setup()
    result.current.onOpenChange(true)
    expect(navigate).not.toHaveBeenCalled()
  })
})
