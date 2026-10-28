import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock(
  '@/modules/admin/model/services/browser.service',
  async () => (await import('./test/fake-browser')).fakeBrowserModule,
)

import { fakeHttp } from '@/shared/test/fake-http'

import { createAdminViewModelContext } from './test/admin-view-model-context'
import { fakeBrowserModule } from './test/fake-browser'
import { useAdminKeysViewModel } from './use-admin-keys.view-model'

const setup = async () => {
  const context = createAdminViewModelContext()
  const hook = renderHook(() => useAdminKeysViewModel(), { wrapper: context.wrapper })
  await waitFor(() => expect(hook.result.current.keys).toHaveLength(2))
  return { ...context, ...hook }
}

describe('useAdminKeysViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the keys with who used each one', async () => {
    const { result } = await setup()
    expect(result.current.keys.map((key) => key.status)).toEqual([
      { type: 'active' },
      { type: 'used', userName: 'lua' },
    ])
    expect(result.current.keys[0].hint).toBe('X4P')
  })

  it('generates with the chosen validity and shows the key once', async () => {
    const { result } = await setup()
    expect(result.current.duration).toBe('7d')
    act(() => result.current.onDurationChange('30d'))
    act(() => result.current.onGenerate())
    await waitFor(() => expect(result.current.newKey).toBe('ABC234'))
    expect(fakeHttp.post).toHaveBeenCalledWith('/admin/registration-invites', { validity: '30d' })
    expect(result.current.newKeyCopied).toBe(false)
    act(() => result.current.onCloseNewKey())
    expect(result.current.newKey).toBeUndefined()
  })

  it('copies the new key', async () => {
    const { result } = await setup()
    act(() => result.current.onGenerate())
    await waitFor(() => expect(result.current.newKey).toBe('ABC234'))
    act(() => result.current.onCopyNewKey())
    await waitFor(() => expect(result.current.newKeyCopied).toBe(true))
    expect(fakeBrowserModule.copyText).toHaveBeenCalledWith('ABC234')
  })

  it('does nothing when copying without a key', async () => {
    const { result } = await setup()
    act(() => result.current.onCopyNewKey())
    expect(fakeBrowserModule.copyText).not.toHaveBeenCalled()
  })

  it('revokes a key and refetches the list', async () => {
    const { result } = await setup()
    const listCalls = () => fakeHttp.get.mock.calls.filter(([url]) => url === '/admin/registration-invites').length
    const before = listCalls()
    act(() => result.current.onRevoke('k1'))
    await waitFor(() => expect(fakeHttp.post).toHaveBeenCalledWith('/admin/registration-invites/k1/revoke'))
    await waitFor(() => expect(listCalls()).toBeGreaterThan(before))
  })
})
