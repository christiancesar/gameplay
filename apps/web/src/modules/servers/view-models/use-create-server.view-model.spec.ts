import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@tanstack/react-router', async () => (await import('@/shared/test/fake-router')).fakeRouterModule)
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)

import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'
import { navigate } from '@/shared/test/fake-router'

import { useServerLimitStore } from './stores/server-limit.store'
import { createdServer, ownedServer } from './test/servers-seed'
import { createServersViewModelContext } from './test/servers-view-model-context'
import { useCreateServerViewModel } from './use-create-server.view-model'

const file = (type: string, size: number) => {
  const value = new File(['x'], 'icon', { type })
  Object.defineProperty(value, 'size', { value: size })
  return value
}

const setup = (servers = [ownedServer]) => {
  const context = createServersViewModelContext(servers)
  return { ...context, ...renderHook(() => useCreateServerViewModel(), { wrapper: context.wrapper }) }
}

describe('useCreateServerViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useServerLimitStore.setState({ refusedAtOwnedCount: null })
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('opens and closes the dialog', () => {
    const { result } = setup()
    expect(result.current.open).toBe(false)
    act(() => result.current.openDialog())
    expect(result.current.open).toBe(true)
    act(() => result.current.onOpenChange(false))
    expect(result.current.open).toBe(false)
  })

  it('creates the server with the translated default room, refreshes the list and opens the server', async () => {
    fakeHttp.post.mockResolvedValue({ data: createdServer })
    const { result, queryClient } = setup()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    act(() => result.current.openDialog())
    act(() => result.current.onSubmit({ name: 'My server' }))
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/servers/$serverId', params: { serverId: 's-new' } }),
    )
    expect(fakeHttp.post).toHaveBeenCalledWith('/servers', {
      name: 'My server',
      defaultRoomName: 'hub.defaultRoomName',
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['servers', 'list'] })
    expect(fakeHttp.put).not.toHaveBeenCalled()
    expect(result.current.open).toBe(false)
  })

  it('uploads the chosen icon after creating the server', async () => {
    fakeHttp.post.mockResolvedValue({ data: createdServer })
    fakeHttp.put.mockResolvedValue({ data: { url: '/icon.webp' } })
    const { result } = setup()
    const icon = file('image/png', 1000)
    act(() => result.current.onSelectIcon(icon))
    expect(result.current.iconPreviewUrl).toBe('blob:preview')
    act(() => result.current.onSubmit({ name: 'My server' }))
    await waitFor(() => expect(navigate).toHaveBeenCalled())
    expect(fakeHttp.put).toHaveBeenCalledWith('/servers/s-new/icon', expect.any(FormData))
    expect((fakeHttp.put.mock.calls[0][1] as FormData).get('file')).toBe(icon)
  })

  it('still opens the server when the icon upload fails', async () => {
    fakeHttp.post.mockResolvedValue({ data: createdServer })
    fakeHttp.put.mockRejectedValue(new ApiError({ code: 'IMAGE_TOO_LARGE', message: 'x' }, 413))
    const { result } = setup()
    act(() => result.current.onSelectIcon(file('image/png', 1000)))
    act(() => result.current.onSubmit({ name: 'My server' }))
    await waitFor(() => expect(navigate).toHaveBeenCalled())
  })

  it('refuses an icon above 2 MB and keeps no preview', () => {
    const { result } = setup()
    act(() => result.current.onSelectIcon(file('image/png', 3 * 1024 * 1024)))
    expect(result.current.iconError).toBe('tooLarge')
    expect(result.current.iconPreviewUrl).toBeUndefined()
  })

  it('refuses an icon in the wrong format', () => {
    const { result } = setup()
    act(() => result.current.onSelectIcon(file('image/gif', 1000)))
    expect(result.current.iconError).toBe('invalidType')
  })

  it('clears the error when a valid icon is chosen next, and removes the icon', () => {
    const { result } = setup()
    act(() => result.current.onSelectIcon(file('image/gif', 1000)))
    act(() => result.current.onSelectIcon(file('image/webp', 1000)))
    expect(result.current.iconError).toBeUndefined()
    expect(result.current.iconPreviewUrl).toBe('blob:preview')
    act(() => result.current.onRemoveIcon())
    expect(result.current.iconPreviewUrl).toBeUndefined()
  })

  it('drops the icon and the error when the dialog closes', () => {
    const { result } = setup()
    act(() => result.current.openDialog())
    act(() => result.current.onSelectIcon(file('image/png', 1000)))
    act(() => result.current.onOpenChange(false))
    expect(result.current.iconPreviewUrl).toBeUndefined()
  })

  it('exposes limitReached, remembers the refusal and does not navigate', async () => {
    fakeHttp.post.mockRejectedValue(new ApiError({ code: 'SERVER_LIMIT_REACHED', message: 'x' }, 409))
    const { result } = setup([ownedServer])
    await waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())
    await act(async () => {
      await Promise.resolve()
    })
    act(() => result.current.onSubmit({ name: 'My server' }))
    await waitFor(() => expect(result.current.formError).toBe('limitReached'))
    expect(useServerLimitStore.getState().refusedAtOwnedCount).toBe(1)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('exposes unexpected for any other failure', async () => {
    fakeHttp.post.mockRejectedValue(new ApiError({ code: 'NETWORK_ERROR', message: 'x' }))
    const { result } = setup()
    act(() => result.current.onSubmit({ name: 'My server' }))
    await waitFor(() => expect(result.current.formError).toBe('unexpected'))
  })

  it('is submitting while the request runs', async () => {
    let finish: (value: { data: typeof createdServer }) => void = () => {}
    fakeHttp.post.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { result } = setup()
    act(() => result.current.onSubmit({ name: 'My server' }))
    await waitFor(() => expect(result.current.isSubmitting).toBe(true))
    finish({ data: createdServer })
    await waitFor(() => expect(result.current.isSubmitting).toBe(false))
  })
})
