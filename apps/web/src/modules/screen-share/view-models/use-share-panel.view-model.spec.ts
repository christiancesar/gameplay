import { act, cleanup, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), warning: vi.fn() }) }))
vi.mock('./share.controller', async () => ({
  shareController: (await import('./test/fake-share-controller')).fakeShareController,
}))

import { defaultShareSettings, idleShare } from '@/modules/screen-share/model/entities/share'

import { useSharePreferencesStore } from './stores/share-preferences.store'
import { useShareStore } from './stores/share.store'
import { fakeShareController } from './test/fake-share-controller'
import { useSharePanelViewModel } from './use-share-panel.view-model'

const profiles = { u2: { name: 'Ana' } }
const live = {
  ...idleShare,
  status: 'live' as const,
  settings: { source: 'window' as const, resolution: '1080p' as const, fps: 60 as const, includeAudio: true },
  viewerIds: ['u2'],
  stats: { u2: { width: 1280, height: 720, fps: 42, kbps: 2100, limitation: 'bandwidth' as const } },
}

const setup = () => renderHook(() => useSharePanelViewModel(profiles))

describe('useSharePanelViewModel', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useShareStore.setState({ ...idleShare })
    useSharePreferencesStore.setState({ saved: null, savedPriority: 'smooth' })
  })

  it('starts idle, with the setup dialog closed', () => {
    const { result } = setup()
    expect(result.current.panel).toEqual({ status: 'idle' })
    expect(result.current.setup.open).toBe(false)
  })

  it('opens the dialog with the default settings', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    expect(result.current.setup).toMatchObject({
      open: true,
      mode: 'start',
      settings: defaultShareSettings,
      saveAsDefault: false,
    })
  })

  it('opens the dialog with the settings saved for next time', () => {
    const saved = { source: 'tab' as const, resolution: '720p' as const, fps: 30 as const, includeAudio: true }
    useSharePreferencesStore.setState({ saved })
    const { result } = setup()
    act(() => result.current.onStart())
    expect(result.current.setup).toMatchObject({ settings: saved, saveAsDefault: true, audioSupport: 'supported' })
  })

  it('tells the audio support of the chosen source', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    act(() => result.current.setup.onChange({ ...defaultShareSettings, source: 'window' }))
    expect(result.current.setup.audioSupport).toBe('windowMaybe')
    fakeShareController.platform.mockReturnValueOnce({
      engine: 'firefox',
      chromiumMajor: 0,
      os: 'windows',
      browser: 'Firefox',
    })
    act(() => result.current.setup.onChange({ ...defaultShareSettings, source: 'screen' }))
    expect(result.current.setup.audioSupport).toBe('browserUnsupported')
  })

  it('starts sharing with the chosen settings and closes the dialog', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    act(() => result.current.setup.onChange({ source: 'tab', resolution: '720p', fps: 60, includeAudio: true }))
    act(() => result.current.setup.onStart())
    expect(fakeShareController.start).toHaveBeenCalledWith(
      { source: 'tab', resolution: '720p', fps: 60, includeAudio: true },
      'smooth',
    )
    expect(result.current.setup.open).toBe(false)
  })

  it('asks for audio even where it is unlikely: the share warns when it does not come', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    act(() => result.current.setup.onChange({ ...defaultShareSettings, source: 'window', includeAudio: true }))
    act(() => result.current.setup.onStart())
    expect(fakeShareController.start).toHaveBeenCalledWith(expect.objectContaining({ includeAudio: true }), 'smooth')
  })

  it('saves the settings for next time only when asked, and forgets them when not', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    act(() => result.current.setup.onSaveAsDefaultChange(true))
    act(() => result.current.setup.onStart())
    expect(useSharePreferencesStore.getState().saved).toEqual(defaultShareSettings)

    act(() => result.current.onStart())
    act(() => result.current.setup.onSaveAsDefaultChange(false))
    act(() => result.current.setup.onStart())
    expect(useSharePreferencesStore.getState().saved).toBeNull()
  })

  it('closing the dialog does not start', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    act(() => result.current.setup.onOpenChange(false))
    expect(result.current.setup.open).toBe(false)
    expect(fakeShareController.start).not.toHaveBeenCalled()
  })

  it('shows the monitor and the viewers while live', () => {
    useShareStore.setState(live)
    const { result } = setup()
    expect(result.current.panel).toMatchObject({
      status: 'live',
      viewerCount: 1,
      limitation: 'bandwidth',
      isOnTarget: false,
    })
    expect(result.current.details.viewers).toEqual([expect.objectContaining({ id: 'u2', name: 'Ana' })])
    expect(result.current.details.target).toEqual({ resolution: '1080p', fps: 60 })
  })

  it('opens the details and closes them when the share ends', () => {
    useShareStore.setState(live)
    const { result } = setup()
    act(() => result.current.onOpenDetails())
    expect(result.current.details.open).toBe(true)
    act(() => useShareStore.setState({ ...idleShare }))
    expect(result.current.details.open).toBe(false)
  })

  it('stops from the panel', () => {
    useShareStore.setState(live)
    const { result } = setup()
    result.current.onStop()
    expect(fakeShareController.stop).toHaveBeenCalledTimes(1)
  })

  it('changes resolution and frame rate live, keeping the source and the audio', () => {
    useShareStore.setState(live)
    const { result } = setup()
    act(() => result.current.onChangeQuality())
    expect(result.current.setup).toMatchObject({ open: true, mode: 'update' })
    act(() => result.current.setup.onChange({ ...live.settings, resolution: '720p', fps: 30, source: 'tab' }))
    act(() => result.current.setup.onStart())
    expect(fakeShareController.updateQuality).toHaveBeenCalledWith(
      { ...live.settings, resolution: '720p', fps: 30 },
      'smooth',
    )
    expect(fakeShareController.start).not.toHaveBeenCalled()
    expect(result.current.setup.open).toBe(false)
  })

  it('starts sharing with the chosen priority', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    expect(result.current.setup.priority).toBe('smooth')
    act(() => result.current.setup.onPriorityChange('sharp'))
    act(() => result.current.setup.onStart())
    expect(fakeShareController.start).toHaveBeenCalledWith(defaultShareSettings, 'sharp')
  })

  it('saves the priority with the settings for next time, and offers it again', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    act(() => result.current.setup.onPriorityChange('sharp'))
    act(() => result.current.setup.onSaveAsDefaultChange(true))
    act(() => result.current.setup.onStart())
    expect(useSharePreferencesStore.getState()).toMatchObject({ saved: defaultShareSettings, savedPriority: 'sharp' })
    act(() => result.current.onStart())
    expect(result.current.setup.priority).toBe('sharp')
  })

  it('does not keep the priority when "use next time" is off', () => {
    useSharePreferencesStore.setState({ saved: defaultShareSettings, savedPriority: 'sharp' })
    const { result } = setup()
    act(() => result.current.onStart())
    act(() => result.current.setup.onSaveAsDefaultChange(false))
    act(() => result.current.setup.onStart())
    expect(useSharePreferencesStore.getState()).toMatchObject({ saved: null, savedPriority: 'smooth' })
  })

  it('changes the priority live, starting from the one running', () => {
    useShareStore.setState({ ...live, priority: 'sharp' })
    const { result } = setup()
    act(() => result.current.onChangeQuality())
    expect(result.current.setup.priority).toBe('sharp')
    act(() => result.current.setup.onPriorityChange('smooth'))
    act(() => result.current.setup.onStart())
    expect(fakeShareController.updateQuality).toHaveBeenCalledWith(live.settings, 'smooth')
  })

  it('tells why a share did not start, once', () => {
    useShareStore.setState({ notice: 'failed' })
    setup()
    expect(toast.error).toHaveBeenCalledWith('share.notices.failed')
    expect(fakeShareController.dismissNotice).toHaveBeenCalledTimes(1)
  })

  it('warns, without an error, when the share runs without the audio it asked for', () => {
    useShareStore.setState({ notice: 'no-audio' })
    setup()
    expect(toast.warning).toHaveBeenCalledWith('share.notices.no-audio')
    expect(toast.error).not.toHaveBeenCalled()
  })
})
