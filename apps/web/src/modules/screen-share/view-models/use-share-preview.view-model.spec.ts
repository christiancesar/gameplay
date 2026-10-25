import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./share.controller', async () => ({
  shareController: (await import('./test/fake-share-controller')).fakeShareController,
}))

import { idleShare } from '@/modules/screen-share/model/entities/share'
import { fakeStream } from '@/shared/media/test/media-fakes'

import { useSharePreferencesStore } from './stores/share-preferences.store'
import { useShareStore } from './stores/share.store'
import { fakeShareController } from './test/fake-share-controller'
import { useSharePreviewViewModel } from './use-share-preview.view-model'

const stream = fakeStream()

function goLive(surface: 'monitor' | 'window') {
  useShareStore.setState({ status: 'live', preview: { stream, surface } })
}

describe('useSharePreviewViewModel', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useShareStore.setState({ ...idleShare })
    useSharePreferencesStore.setState({ previewHidden: null })
  })

  it('has nothing to show unless the share is live', () => {
    const { result } = renderHook(() => useSharePreviewViewModel())
    expect(result.current).toMatchObject({ visible: false, stream: null })
  })

  it('shows the preview of a window and hides it for the entire screen by default', () => {
    goLive('window')
    expect(renderHook(() => useSharePreviewViewModel()).result.current).toMatchObject({
      visible: true,
      stream,
      hidden: false,
    })
    goLive('monitor')
    expect(renderHook(() => useSharePreviewViewModel()).result.current.hidden).toBe(true)
  })

  it('keeps the choice of the user over the default and remembers it', () => {
    goLive('monitor')
    const { result } = renderHook(() => useSharePreviewViewModel())
    act(() => result.current.onToggleHidden())
    expect(useSharePreferencesStore.getState().previewHidden).toBe(false)
    expect(result.current.hidden).toBe(false)
    act(() => result.current.onToggleHidden())
    expect(useSharePreferencesStore.getState().previewHidden).toBe(true)
  })

  it('stops the share through the controller', () => {
    goLive('window')
    renderHook(() => useSharePreviewViewModel()).result.current.onStop()
    expect(fakeShareController.stop).toHaveBeenCalledTimes(1)
  })
})
