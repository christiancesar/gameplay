import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock('@tanstack/react-router', async () => (await import('@/shared/test/fake-router')).fakeRouterModule)

import { toast } from 'sonner'

import { fakeHttp } from '@/shared/test/fake-http'
import { navigate } from '@/shared/test/fake-router'

import { createAdminViewModelContext } from './test/admin-view-model-context'
import { adminMedia, mediaUsage } from './test/media-seed'
import { useAdminMediaViewModel } from './use-admin-media.view-model'

const setup = async () => {
  const context = createAdminViewModelContext()
  const hook = renderHook(() => useAdminMediaViewModel(), { wrapper: context.wrapper })
  await waitFor(() => expect(hook.result.current.mediaTab.data).toEqual(adminMedia))
  return { ...context, ...hook }
}

describe('useAdminMediaViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('turns a resource on without asking', async () => {
    const { result } = await setup()
    act(() => result.current.mediaTab.onToggle('mesh', true))
    await waitFor(() =>
      expect(fakeHttp.put).toHaveBeenCalledWith('/admin/media', {
        settings: { sfu: true, mesh: true, turn: true },
        notice: undefined,
      }),
    )
    expect(toast.success).toHaveBeenCalledWith('admin.media.saved')
  })

  it('asks before turning a resource off, with how many people it cuts off', async () => {
    const { result } = await setup()
    act(() => result.current.mediaTab.onToggle('turn', false))
    expect(result.current.confirmDialog).toMatchObject({ open: true, resources: ['turn'], scope: 'global' })
    await waitFor(() => expect(result.current.confirmDialog.impact).toBe(4))
    expect(fakeHttp.put).not.toHaveBeenCalled()

    act(() => result.current.confirmDialog.onConfirm({ title: 'TURN off', message: 'Sorry.', audience: 'everyone' }))
    await waitFor(() =>
      expect(fakeHttp.put).toHaveBeenCalledWith('/admin/media', {
        settings: { sfu: true, mesh: true, turn: false },
        notice: { title: 'TURN off', message: 'Sorry.', audience: 'everyone' },
      }),
    )
  })

  it('cancelling keeps everything as it was', async () => {
    const { result } = await setup()
    act(() => result.current.mediaTab.onToggle('sfu', false))
    act(() => result.current.confirmDialog.onCancel())
    expect(result.current.confirmDialog.open).toBe(false)
    expect(fakeHttp.put).not.toHaveBeenCalled()
  })

  it('opens "Adjust server" for an exception', async () => {
    const { result } = await setup()
    result.current.mediaTab.onAdjustServer('sv1')
    expect(navigate).toHaveBeenCalledWith({ to: '/admin/servers', search: { edit: 'sv1' } })
  })

  it('saves the monthly SFU budget', async () => {
    const { result } = await setup()
    act(() => result.current.mediaTab.onSaveBudget(900))
    await waitFor(() => expect(fakeHttp.put).toHaveBeenCalledWith('/admin/media/budget', { budgetGb: 900 }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('admin.media.budget.saved'))
  })

  it('shows the usage of the last 24 hours first, and asks again when the period changes', async () => {
    const { result } = await setup()
    await waitFor(() => expect(result.current.mediaTab.usage.data).toEqual(mediaUsage))
    expect(fakeHttp.get).toHaveBeenCalledWith('/admin/media/usage', { params: { period: '24h' } })

    act(() => result.current.mediaTab.usage.onPeriodChange('7d'))
    await waitFor(() => expect(fakeHttp.get).toHaveBeenCalledWith('/admin/media/usage', { params: { period: '7d' } }))
  })

  it('a custom range starts on the last 7 days and asks for the days applied', async () => {
    const { result } = await setup()
    act(() => result.current.mediaTab.usage.onPeriodChange('custom'))
    expect(result.current.mediaTab.usage.period).toBe('custom')
    const { from, to } = result.current.mediaTab.usage.range
    await waitFor(() =>
      expect(fakeHttp.get).toHaveBeenCalledWith('/admin/media/usage', { params: { period: 'custom', from, to } }),
    )

    act(() => result.current.mediaTab.usage.onApplyRange({ from: '2026-10-02', to: '2026-10-05' }))
    expect(result.current.mediaTab.usage.range).toEqual({ from: '2026-10-02', to: '2026-10-05' })
    await waitFor(() =>
      expect(fakeHttp.get).toHaveBeenCalledWith('/admin/media/usage', {
        params: { period: 'custom', from: '2026-10-02', to: '2026-10-05' },
      }),
    )
  })
})
