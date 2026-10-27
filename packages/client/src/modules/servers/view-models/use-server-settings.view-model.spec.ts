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

import { navigate } from '@/shared/test/fake-router'

import { route, searchCalls } from './test/fake-server-settings-router'
import { createServerSettingsViewModelContext } from './test/server-settings-view-model-context'
import { adminDetail, memberDetail, settingsDetail } from './test/server-settings-seed'
import { useServerSettingsViewModel } from './use-server-settings.view-model'

const setup = (detail = settingsDetail) => {
  const context = createServerSettingsViewModelContext({ detail })
  return { ...renderHook(() => useServerSettingsViewModel(), { wrapper: context.wrapper }), ...context }
}

describe('useServerSettingsViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.section = 'general'
  })

  it('opens on the section of the URL once the server is known', async () => {
    const { result } = setup()
    expect(result.current.open).toBe(false)
    await waitFor(() => expect(result.current.open).toBe(true))
    expect(result.current).toMatchObject({
      serverId: 's1',
      section: 'general',
      serverName: 'Turbex',
      pendingRequests: 1,
    })
  })

  it('opens for an admin too', async () => {
    const { result } = setup(adminDetail)
    await waitFor(() => expect(result.current.open).toBe(true))
  })

  it('stays closed and does not load anything without the search param', async () => {
    route.section = undefined
    const { result } = setup()
    await act(async () => undefined)
    expect(result.current.open).toBe(false)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('closes the modal for a plain member who opened the URL', async () => {
    const { result } = setup(memberDetail)
    await waitFor(() => expect(navigate).toHaveBeenCalled())
    expect(result.current.open).toBe(false)
    expect(searchCalls).toHaveBeenCalledWith({ watch: 'u9', serverSettings: undefined })
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ replace: true }))
  })

  it('replaces the param when the section changes', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.open).toBe(true))
    act(() => result.current.onSectionChange('rooms'))
    expect(searchCalls).toHaveBeenCalledWith({ watch: 'u9', serverSettings: 'rooms' })
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ replace: true }))
  })

  it('removes the param when it closes, keeping the other search params', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.open).toBe(true))
    act(() => result.current.onOpenChange(false))
    expect(searchCalls).toHaveBeenCalledWith({ watch: 'u9', serverSettings: undefined })
  })
})
