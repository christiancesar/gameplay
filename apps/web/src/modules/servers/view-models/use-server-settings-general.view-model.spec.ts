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
import { settingsDetail } from './test/server-settings-seed'
import { useServerSettingsGeneralViewModel } from './use-server-settings-general.view-model'

const setup = () => {
  const context = createServerSettingsViewModelContext({ detail: settingsDetail })
  const hook = renderHook(() => useServerSettingsGeneralViewModel('s1'), { wrapper: context.wrapper })
  return { ...hook, ...context }
}

const ready = async (result: { current: ReturnType<typeof useServerSettingsGeneralViewModel> }) =>
  waitFor(() => expect(result.current.isLoading).toBe(false))

const image = (type = 'image/png', size = 1000) => new File([new Uint8Array(size)], 'a.png', { type })

describe('useServerSettingsGeneralViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exposes the saved values and images', async () => {
    const { result } = setup()
    await ready(result)
    expect(result.current.values).toEqual({ name: 'Turbex', description: 'Dota on Fridays.' })
    expect(result.current.iconUrl).toBe('/icons/s1.webp')
    expect(result.current.coverUrl).toBeUndefined()
  })

  it('saves name and description, refreshes the server and the list, and confirms', async () => {
    const { result, queryClient } = setup()
    await ready(result)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    act(() => result.current.onSave({ name: 'New', description: '' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('serverSettings.general.saved'))
    expect(settingsHttp.patch).toHaveBeenCalledWith('/servers/s1', { name: 'New', description: '' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['servers', 'detail', 's1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['servers', 'list'] })
  })

  it('toasts when saving fails', async () => {
    const { result } = setup()
    await ready(result)
    settingsHttp.patch.mockRejectedValueOnce(new ApiError({ code: 'SERVER_PERMISSION_DENIED', message: 'no' }, 403))
    act(() => result.current.onSave({ name: 'New', description: '' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('serverSettings.errors.permissionDenied'))
  })

  it('uploads the icon as multipart and the cover to its own route', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onSelectIcon(image()))
    await waitFor(() => expect(settingsHttp.put).toHaveBeenCalledWith('/servers/s1/icon', expect.any(FormData)))
    act(() => result.current.onSelectCover(image()))
    await waitFor(() => expect(settingsHttp.put).toHaveBeenCalledWith('/servers/s1/cover', expect.any(FormData)))
  })

  it('rejects a bad file before calling the API, per image', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onSelectIcon(image('image/gif')))
    act(() => result.current.onSelectCover(image('image/png', 3 * 1024 * 1024)))
    expect(result.current.iconError).toBe('invalidType')
    expect(result.current.coverError).toBe('tooLarge')
    expect(settingsHttp.put).not.toHaveBeenCalled()
  })

  it('shows uploadFailed when the upload fails and clears it on the next valid pick', async () => {
    const { result } = setup()
    await ready(result)
    settingsHttp.put.mockRejectedValueOnce(new Error('network'))
    act(() => result.current.onSelectIcon(image()))
    await waitFor(() => expect(result.current.iconError).toBe('uploadFailed'))
    act(() => result.current.onSelectIcon(image()))
    expect(result.current.iconError).toBeUndefined()
  })

  it('removes icon and cover', async () => {
    const { result } = setup()
    await ready(result)
    act(() => result.current.onRemoveIcon())
    await waitFor(() => expect(settingsHttp.delete).toHaveBeenCalledWith('/servers/s1/icon'))
    act(() => result.current.onRemoveCover())
    await waitFor(() => expect(settingsHttp.delete).toHaveBeenCalledWith('/servers/s1/cover'))
  })
})
