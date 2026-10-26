import { act, cleanup, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
vi.mock('./share.controller', async () => ({
  shareController: (await import('./test/fake-share-controller')).fakeShareController,
}))

import { idleWatch } from '@/modules/screen-share/model/entities/watch'

import { useWatchStore } from './stores/watch.store'
import { fakeShareController } from './test/fake-share-controller'
import { useWatchSelectionViewModel } from './use-watch-selection.view-model'

type Input = Parameters<typeof useWatchSelectionViewModel>[0]

const setup = (initial: Partial<Input> = {}) => {
  const onClose = vi.fn()
  const hook = renderHook((props: Input) => useWatchSelectionViewModel(props), {
    initialProps: {
      watchId: 'u2' as string | undefined,
      ready: true,
      inCall: true,
      liveIds: ['u2', 'u3'],
      onClose,
      ...initial,
    },
  })
  return { ...hook, onClose }
}

describe('useWatchSelectionViewModel', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useWatchStore.setState({ ...idleWatch })
  })

  it('watches the person of the URL when they are live', () => {
    const { onClose } = setup()
    expect(fakeShareController.watch).toHaveBeenCalledWith('u2')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('waits while the call has no roster yet', () => {
    const { onClose } = setup({ ready: false, liveIds: [] })
    expect(fakeShareController.watch).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('clears the URL when the person is not live', () => {
    const { onClose } = setup({ liveIds: ['u3'] })
    expect(fakeShareController.watch).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('clears the URL when there is no call at all', () => {
    const { onClose } = setup({ inCall: false, ready: false, liveIds: [] })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes the view when the streamer stops', () => {
    const { rerender, onClose } = setup()
    rerender({ watchId: 'u2', ready: true, inCall: true, liveIds: ['u3'], onClose })
    expect(onClose).toHaveBeenCalled()
  })

  it('switches to the screen the URL now names', () => {
    const { rerender, onClose } = setup()
    rerender({ watchId: 'u3', ready: true, inCall: true, liveIds: ['u2', 'u3'], onClose })
    expect(fakeShareController.watch).toHaveBeenLastCalledWith('u3')
  })

  it('stops watching when the URL no longer names anyone', () => {
    const { rerender, onClose } = setup()
    rerender({ watchId: undefined, ready: true, inCall: true, liveIds: ['u2'], onClose })
    expect(fakeShareController.stopWatching).toHaveBeenCalled()
  })

  it('tells when the streamer refused and closes the view', () => {
    const { onClose } = setup()
    act(() => useWatchStore.setState({ failed: true }))
    expect(toast.error).toHaveBeenCalledWith('share.watchFailed')
    expect(fakeShareController.dismissWatchFailure).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
