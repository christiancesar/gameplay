import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))

import { toast } from 'sonner'

import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'

import { createAdminViewModelContext } from './test/admin-view-model-context'
import { useAdminLimitsViewModel } from './use-admin-limits.view-model'

const saved = { serversPerUser: 2, membersPerServer: 10, roomsPerServer: 2 }

const setup = async () => {
  const context = createAdminViewModelContext()
  const hook = renderHook(() => useAdminLimitsViewModel(), { wrapper: context.wrapper })
  await waitFor(() => expect(hook.result.current.values.membersPerServer).toBe(10))
  return { ...context, ...hook }
}

describe('useAdminLimitsViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the global limits once loaded', async () => {
    const { result } = await setup()
    expect(result.current.values).toEqual({
      serversPerUser: 1,
      membersPerServer: 10,
      roomsPerServer: 2,
    })
  })

  it('saves in the API shape, keeps the answer and shows a toast', async () => {
    const { result } = await setup()
    fakeHttp.put.mockResolvedValueOnce({
      data: { maxServersPerUser: 2, maxMembersPerServer: 10, maxRoomsPerServer: 2 },
    })
    act(() => result.current.onSave(saved))
    await waitFor(() =>
      expect(fakeHttp.put).toHaveBeenCalledWith('/admin/settings', {
        maxServersPerUser: 2,
        maxMembersPerServer: 10,
        maxRoomsPerServer: 2,
      }),
    )
    await waitFor(() => expect(result.current.values.serversPerUser).toBe(2))
    expect(toast.success).toHaveBeenCalledWith('admin.limits.saved')
  })

  it('shows an error toast when saving fails', async () => {
    const { result } = await setup()
    fakeHttp.put.mockRejectedValueOnce(new ApiError({ code: 'BOOM', message: 'x' }, 500))
    act(() => result.current.onSave(saved))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('admin.errors.unexpected'))
    expect(result.current.isSaving).toBe(false)
  })
})
