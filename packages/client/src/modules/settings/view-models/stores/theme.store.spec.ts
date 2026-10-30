import { beforeEach, describe, expect, it } from 'vitest'

import { useThemeStore } from './theme.store'

describe('theme store', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'dark', pendingAccountSync: false })
  })

  it('defaults to dark', () => {
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('updates the theme', () => {
    useThemeStore.getState().setTheme('system')
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('marks a guest choice for account sync', () => {
    useThemeStore.getState().setTheme('light', true)

    expect(useThemeStore.getState()).toMatchObject({ theme: 'light', pendingAccountSync: true })
  })
})
