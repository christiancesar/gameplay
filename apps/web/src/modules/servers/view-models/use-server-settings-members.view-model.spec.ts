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
import { settingsDetail, settingsMembers } from './test/server-settings-seed'
import { useServerSettingsMembersViewModel } from './use-server-settings-members.view-model'

const setup = (userId = 'u1') => {
  const context = createServerSettingsViewModelContext({ detail: settingsDetail, members: settingsMembers, userId })
  const hook = renderHook(() => useServerSettingsMembersViewModel('s1'), { wrapper: context.wrapper })
  return { ...hook, ...context }
}

const ready = async (result: { current: ReturnType<typeof useServerSettingsMembersViewModel> }) =>
  waitFor(() => {
    expect(result.current.isLoading).toBe(false)
    expect(result.current.members).toHaveLength(3)
  })

describe('useServerSettingsMembersViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists members by role, marks the current user and exposes the limit', async () => {
    const { result } = setup('u3')
    await ready(result)
    expect(result.current.members.map((member) => [member.id, member.isMe])).toEqual([
      ['u1', false],
      ['u3', true],
      ['u2', false],
    ])
    expect(result.current.memberLimit).toBe(4)
  })

  it.each([
    ['onPromote', 'promote'],
    ['onDemote', 'demote'],
    ['onKick', 'kick'],
  ] as const)('%s posts to the %s route of the member', async (handler, route) => {
    const { result, queryClient } = setup()
    await ready(result)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    act(() => result.current[handler]('u2'))
    await waitFor(() => expect(settingsHttp.post).toHaveBeenCalledWith(`/servers/s1/members/u2/${route}`))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['servers', 'detail', 's1'] }))
  })

  it('toasts when the member is already gone', async () => {
    const { result } = setup()
    await ready(result)
    settingsHttp.post.mockRejectedValueOnce(new ApiError({ code: 'MEMBER_NOT_FOUND', message: 'gone' }, 404))
    act(() => result.current.onKick('u2'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.memberNotFound'))
  })
})
