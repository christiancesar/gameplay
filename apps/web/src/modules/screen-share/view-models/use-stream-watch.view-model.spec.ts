import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./share.controller', async () => ({
  shareController: (await import('./test/fake-share-controller')).fakeShareController,
}))
vi.mock('@/shared/media/fullscreen', () => ({ toggleStreamFullscreen: vi.fn() }))

import { idleWatch } from '@/modules/screen-share/model/entities/watch'
import { toggleStreamFullscreen } from '@/shared/media/fullscreen'
import { fakeStream } from '@/shared/media/test/media-fakes'

import { useWatchStore } from './stores/watch.store'
import { fakeShareController } from './test/fake-share-controller'
import { useStreamWatchViewModel } from './use-stream-watch.view-model'

describe('useStreamWatchViewModel', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useWatchStore.setState({ ...idleWatch })
  })

  it('waits for the video, then hands the stream over', () => {
    const { result } = renderHook(() => useStreamWatchViewModel())
    expect(result.current).toMatchObject({ stream: null, isWaiting: true, volume: 100 })
    const stream = fakeStream()
    useWatchStore.setState({ stream, status: 'playing' })
    const next = renderHook(() => useStreamWatchViewModel())
    expect(next.result.current).toMatchObject({ stream, isWaiting: false })
  })

  it('sends the volume and the fullscreen to the session and the browser', () => {
    const { result } = renderHook(() => useStreamWatchViewModel())
    result.current.onVolumeChange(35)
    result.current.onFullscreen()
    expect(fakeShareController.setStreamVolume).toHaveBeenCalledWith(35)
    expect(toggleStreamFullscreen).toHaveBeenCalledTimes(1)
  })
})
