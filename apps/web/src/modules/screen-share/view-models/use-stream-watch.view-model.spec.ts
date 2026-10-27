import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./share.controller', async () => ({
  shareController: (await import('./test/fake-share-controller')).fakeShareController,
}))
vi.mock('@/shared/media/fullscreen', async () => (await import('./test/fake-fullscreen')).fakeFullscreen)
vi.mock('@/shared/lib/use-media-query', async () => ({
  PHONE_LANDSCAPE_QUERY: 'sideways',
  useMediaQuery: (await import('./test/fake-media-query')).useFakeMediaQuery,
}))

import { idleWatch } from '@/modules/screen-share/model/entities/watch'
import { fakeStream } from '@/shared/media/test/media-fakes'

import { idlePlayer, useStreamPlayerStore } from './stores/stream-player.store'
import { useWatchStore } from './stores/watch.store'
import { fakeFullscreen } from './test/fake-fullscreen'
import { fakeMediaQuery } from './test/fake-media-query'
import { fakeShareController } from './test/fake-share-controller'
import { useStreamWatchViewModel } from './use-stream-watch.view-model'

describe('useStreamWatchViewModel', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useWatchStore.setState({ ...idleWatch })
    useStreamPlayerStore.setState({ ...idlePlayer })
    fakeMediaQuery.matches = false
  })

  it('waits for the video, then hands the stream over', () => {
    const { result } = renderHook(() => useStreamWatchViewModel())
    expect(result.current).toMatchObject({ stream: null, isWaiting: true, volume: 100 })
    const stream = fakeStream()
    useWatchStore.setState({ stream, status: 'playing' })
    const next = renderHook(() => useStreamWatchViewModel())
    expect(next.result.current).toMatchObject({ stream, isWaiting: false })
  })

  it('hands over what reaches me and whether the stream has audio, once it plays', () => {
    useWatchStore.setState({ status: 'waiting' })
    expect(renderHook(() => useStreamWatchViewModel()).result.current).toMatchObject({
      received: undefined,
      hasAudio: true,
    })
    const quality = { width: 1280, height: 720, fps: 58, kbps: 3100 }
    useWatchStore.setState({ status: 'playing', stream: fakeStream(), quality, hasAudio: false })
    expect(renderHook(() => useStreamWatchViewModel()).result.current).toMatchObject({
      received: quality,
      hasAudio: false,
    })
  })

  it('sends the volume to the session', () => {
    const { result } = renderHook(() => useStreamWatchViewModel())
    result.current.onVolumeChange(35)
    expect(fakeShareController.setStreamVolume).toHaveBeenCalledWith(35)
  })

  it('hands over the quality I asked for and sends a new one to the session', () => {
    const { result } = renderHook(() => useStreamWatchViewModel())
    expect(result.current.level).toBe('auto')
    act(() => result.current.onLevelChange('medium'))
    expect(fakeShareController.setStreamQuality).toHaveBeenCalledWith('medium')
  })

  it('goes immersive when asked, with real fullscreen where the browser has it, and back', () => {
    const { result } = renderHook(() => useStreamWatchViewModel())
    expect(result.current.immersive).toBe(false)
    act(() => result.current.onImmersiveChange(true))
    expect(result.current.immersive).toBe(true)
    expect(fakeFullscreen.enterStreamFullscreen).toHaveBeenCalledTimes(1)
    act(() => result.current.onImmersiveChange(false))
    expect(result.current.immersive).toBe(false)
    expect(fakeFullscreen.exitStreamFullscreen).toHaveBeenCalledTimes(1)
  })

  it('leaves immersive when the browser leaves fullscreen on its own', () => {
    const { result } = renderHook(() => useStreamWatchViewModel())
    act(() => result.current.onImmersiveChange(true))
    act(() => fakeFullscreen.browserExits())
    expect(result.current.immersive).toBe(false)
  })

  it('goes immersive on a phone turned sideways, and stays out once left until it turns upright', () => {
    fakeMediaQuery.matches = true
    const { result, rerender } = renderHook(() => useStreamWatchViewModel())
    expect(result.current.immersive).toBe(true)
    expect(fakeFullscreen.enterStreamFullscreen).not.toHaveBeenCalled()

    act(() => result.current.onImmersiveChange(false))
    expect(result.current.immersive).toBe(false)

    fakeMediaQuery.matches = false
    rerender()
    fakeMediaQuery.matches = true
    rerender()
    expect(result.current.immersive).toBe(true)
  })

  it('keeps immersive asked by the button when the phone turns upright', () => {
    fakeMediaQuery.matches = true
    const { result, rerender } = renderHook(() => useStreamWatchViewModel())
    act(() => result.current.onImmersiveChange(true))
    fakeMediaQuery.matches = false
    rerender()
    expect(result.current.immersive).toBe(true)
  })

  it('starts normal next time', () => {
    const { result, unmount } = renderHook(() => useStreamWatchViewModel())
    act(() => result.current.onImmersiveChange(true))
    unmount()
    expect(useStreamPlayerStore.getState()).toEqual(idlePlayer)
  })
})
