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

import { createServerSettingsViewModelContext } from './test/server-settings-view-model-context'
import { settingsHttp } from './test/server-settings-http'
import { fullDetail, settingsDetail, settingsInvites } from './test/server-settings-seed'
import { useServerSettingsInvitesViewModel } from './use-server-settings-invites.view-model'

const setup = (detail = settingsDetail) => {
  const context = createServerSettingsViewModelContext({ detail, invites: settingsInvites })
  const hook = renderHook(() => useServerSettingsInvitesViewModel('s1'), { wrapper: context.wrapper })
  return { ...hook, ...context }
}

const ready = async (result: { current: ReturnType<typeof useServerSettingsInvitesViewModel> }) =>
  waitFor(() => {
    expect(result.current.isLoading).toBe(false)
    expect(result.current.invites).toHaveLength(3)
  })

describe('useServerSettingsInvitesViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('lists invites with the member counters of the server', async () => {
    const { result } = setup()
    await ready(result)
    expect(result.current).toMatchObject({ memberCount: 3, memberLimit: 4, autoApprove: false })
    expect(result.current.invites[0]?.link).toBe(`${window.location.origin}/i/JH34SD32`)
  })

  it('reports a full server so the View blocks generation', async () => {
    const { result } = setup(fullDetail)
    await ready(result)
    expect(result.current.memberCount).toBe(result.current.memberLimit)
  })

  it('generates an invite and refreshes the list', async () => {
    const { result } = setup()
    await ready(result)
    settingsHttp.post.mockResolvedValueOnce({ data: settingsInvites[1] })
    act(() => result.current.onGenerate())
    await waitFor(() => expect(settingsHttp.post).toHaveBeenCalledWith('/servers/s1/invites'))
    await waitFor(() =>
      expect(settingsHttp.get.mock.calls.filter(([url]) => url === '/servers/s1/invites')).toHaveLength(2),
    )
  })

  it('toasts the API error when the server filled up meanwhile', async () => {
    const { result } = setup()
    await ready(result)
    settingsHttp.post.mockRejectedValueOnce(new ApiError({ code: 'MEMBER_LIMIT_REACHED', message: 'full' }, 409))
    act(() => result.current.onGenerate())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.memberLimitReached'))
  })

  it('copies the link and marks the code as copied', async () => {
    const { result } = setup()
    await ready(result)
    await act(async () => result.current.onCopy('JH34SD32'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/i/JH34SD32`)
    expect(result.current.copiedCode).toBe('JH34SD32')
  })

  it('toasts when the clipboard is not available', async () => {
    const { result } = setup()
    await ready(result)
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'))
    await act(async () => result.current.onCopy('JH34SD32'))
    expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.copyFailed')
    expect(result.current.copiedCode).toBeUndefined()
  })

  it('revokes by invite id, found from the code', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onRevoke('JH34SD32'))
    await waitFor(() => expect(settingsHttp.post).toHaveBeenCalledWith('/servers/s1/invites/i1/revoke'))
  })

  it('toggles auto approval and shows the new value while the request runs', async () => {
    const { result } = setup()
    await ready(result)
    let finish: () => void = () => undefined
    settingsHttp.put.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)))
    act(() => result.current.onAutoApproveChange(true))
    await waitFor(() => expect(result.current.autoApprove).toBe(true))
    finish()
    await waitFor(() =>
      expect(settingsHttp.put).toHaveBeenCalledWith('/servers/s1/auto-approve', { autoApprove: true }),
    )
  })
})
