import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('./test/server-settings-http')).settingsHttp }))
vi.mock(
  '@tanstack/react-router',
  async () => (await import('./test/fake-server-settings-router')).fakeServerSettingsRouterModule,
)
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

import { toast } from 'sonner'

import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { ApiError } from '@/shared/lib/api-error'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { useServerSettingsFailureViewModel } from './use-server-settings-failure.view-model'

const setup = () => {
  const context = createQueryClientContext()
  const invalidate = vi.spyOn(context.queryClient, 'invalidateQueries')
  const hook = renderHook(() => useServerSettingsFailureViewModel('s1'), { wrapper: context.wrapper })
  return { ...hook, invalidate }
}

describe('useServerSettingsFailureViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('toasts the mapped message and refreshes the server when the API explained the failure', () => {
    const { result, invalidate } = setup()
    result.current(new ApiError({ code: 'MEMBER_LIMIT_REACHED', message: 'full' }, 409))
    expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.memberLimitReached')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: serversKeys.detail('s1') })
  })

  it('toasts the generic message without refreshing for an unknown failure', () => {
    const { result, invalidate } = setup()
    result.current(new Error('boom'))
    expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.unexpected')
    expect(invalidate).not.toHaveBeenCalled()
  })
})
