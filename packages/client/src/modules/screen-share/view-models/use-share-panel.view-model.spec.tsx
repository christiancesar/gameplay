import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), warning: vi.fn() }) }))
vi.mock('./share.controller', async () => ({
  shareController: (await import('./test/fake-share-controller')).fakeShareController,
}))

import { defaultShareSettings, idleShare } from '@/modules/screen-share/model/entities/share'
import { useVoiceStore } from '@/modules/rooms/view-models/stores/voice.store'
import { PlatformProvider } from '@/shared/platform/platform-provider'
import { FakePlatform, type FakePlatformOptions } from '@/shared/platform/test/fake-platform'
import { fakeHttp } from '@/shared/test/fake-http'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { useSharePreferencesStore } from './stores/share-preferences.store'
import { useShareStore } from './stores/share.store'
import { fakeShareController } from './test/fake-share-controller'
import { browserSource, gameSource, screenSource } from './test/source-seed'
import { useSharePanelViewModel } from './use-share-panel.view-model'

const profiles = { u2: { name: 'Ana' } }
const live = {
  ...idleShare,
  status: 'live' as const,
  settings: {
    source: 'window' as const,
    resolution: '1080p' as const,
    aspectRatio: '16:9' as const,
    fps: 60 as const,
    includeAudio: true,
    audioApps: [],
  },
  viewerIds: ['u2'],
  stats: { u2: { width: 1280, height: 720, fps: 42, kbps: 2100, limitation: 'bandwidth' as const } },
}

const setup = (platformOptions: FakePlatformOptions = {}) => {
  const { wrapper: queryWrapper } = createQueryClientContext()
  const platform = new FakePlatform(platformOptions)
  const wrapper = ({ children }: { children: ReactNode }) =>
    queryWrapper({ children: <PlatformProvider platform={platform}>{children}</PlatformProvider> })
  return renderHook(() => useSharePanelViewModel(profiles), { wrapper })
}

/** Without a call the server's media is unknown: the share goes Direct, as before the SFU. */
const DIRECT = { mode: 'mesh', fallbackToMesh: true }

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
    const saved = {
      source: 'tab' as const,
      resolution: '720p' as const,
      aspectRatio: '16:9' as const,
      fps: 30 as const,
      includeAudio: true,
      audioApps: [],
    }
    useSharePreferencesStore.setState({ saved })
    const { result } = setup()
    act(() => result.current.onStart())
    expect(result.current.setup).toMatchObject({ settings: saved, saveAsDefault: true, audioSupport: 'supported' })
  })

  it('tells the audio support of the chosen source', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    act(() => result.current.setup.onChange({ ...defaultShareSettings, source: 'window' }))
    expect(result.current.setup.audioSupport).toBe('windowUnsupported')
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
    act(() =>
      result.current.setup.onChange({
        source: 'tab',
        resolution: '720p',
        aspectRatio: '16:9',
        fps: 60,
        includeAudio: true,
        audioApps: [],
      }),
    )
    act(() => result.current.setup.onStart())
    expect(fakeShareController.start).toHaveBeenCalledWith(
      { source: 'tab', resolution: '720p', aspectRatio: '16:9', fps: 60, includeAudio: true, audioApps: [] },
      'smooth',
      DIRECT,
    )
    expect(result.current.setup.open).toBe(false)
  })

  it('does not ask for audio from a source that has none', () => {
    const { result } = setup()
    act(() => result.current.onStart())
    act(() =>
      result.current.setup.onChange({ ...defaultShareSettings, source: 'window', includeAudio: true, audioApps: [] }),
    )
    act(() => result.current.setup.onStart())
    expect(fakeShareController.start).toHaveBeenCalledWith(
      expect.objectContaining({ includeAudio: false, audioApps: [] }),
      'smooth',
      DIRECT,
    )
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
    expect(result.current.details.target).toEqual({ resolution: '1080p', aspectRatio: '16:9', fps: 60 })
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
    expect(fakeShareController.start).toHaveBeenCalledWith(defaultShareSettings, 'sharp', DIRECT)
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

  describe('how the share is sent', () => {
    const offer = (media: object) => {
      useVoiceStore.setState({ connection: { serverId: 's1', roomId: 'r1' } })
      fakeHttp.get.mockImplementation(async (url: string) => {
        if (url === '/servers/s1/media') return { data: media }
        throw new Error(`unexpected GET ${url}`)
      })
    }
    const ALL = { sfu: { available: true, reason: null }, mesh: { available: true }, turn: { available: true } }
    afterEach(() => useVoiceStore.setState({ connection: null }))

    it('opens on Server (SFU) and lets Direct stand in when it fails', async () => {
      offer(ALL)
      const { result } = setup()
      await vi.waitFor(() => expect(result.current.setup.streamModes).toBeDefined())
      act(() => result.current.onStart())
      expect(result.current.setup.streamMode).toBe('sfu')
      act(() => result.current.setup.onStart())
      expect(fakeShareController.start).toHaveBeenCalledWith(defaultShareSettings, 'smooth', {
        mode: 'sfu',
        fallbackToMesh: true,
      })
    })

    it('starts Direct when picked', async () => {
      offer(ALL)
      const { result } = setup()
      await vi.waitFor(() => expect(result.current.setup.streamModes).toBeDefined())
      act(() => result.current.onStart())
      act(() => result.current.setup.onStreamModeChange('mesh'))
      act(() => result.current.setup.onStart())
      expect(fakeShareController.start).toHaveBeenCalledWith(defaultShareSettings, 'smooth', {
        mode: 'mesh',
        fallbackToMesh: true,
      })
    })

    it('uses what the server leaves, and does not start when it leaves nothing', async () => {
      offer({ ...ALL, sfu: { available: false, reason: 'disabled' }, mesh: { available: false } })
      const { result } = setup()
      await vi.waitFor(() => expect(result.current.setup.streamModes).toBeDefined())
      act(() => result.current.onStart())
      expect(result.current.setup.streamMode).toBeUndefined()
      act(() => result.current.setup.onStart())
      expect(fakeShareController.start).not.toHaveBeenCalled()
    })

    it('warns when the share went Direct, and says why the admin stopped it', () => {
      setup()
      act(() => useShareStore.setState({ notice: 'fell-back' }))
      expect(toast.warning).toHaveBeenCalledWith('share.notices.fell-back')
      act(() => useShareStore.setState({ notice: 'disabled' }))
      expect(toast.error).toHaveBeenCalledWith('share.notices.disabled')
    })
  })

  describe('on a Linux host with PipeWire audio', () => {
    const desktop = { kind: 'desktop' as const, capabilities: { appAudio: true, systemAudioWithoutApp: true } }

    it('offers system audio without the call and hides the application list', () => {
      const { result } = setup(desktop)
      act(() => result.current.onStart())
      expect(result.current.setup.audioSupport).toBe('systemWithoutApp')
      expect(result.current.setup.audioApps).toBeUndefined()
    })

    it('starts with system audio when no application was chosen', () => {
      const { result } = setup(desktop)
      act(() => result.current.onStart())
      act(() => result.current.setup.onChange({ ...defaultShareSettings, includeAudio: true }))
      act(() => result.current.setup.onStart())
      expect(fakeShareController.start).toHaveBeenCalledWith(
        expect.objectContaining({ includeAudio: true, audioApps: [] }),
        'smooth',
        DIRECT,
      )
    })

    it('opens with the applications of a setting saved before they existed', () => {
      useSharePreferencesStore.setState({
        saved: { source: 'tab', resolution: '720p', fps: 30, includeAudio: true } as never,
      })
      const { result } = setup(desktop)

      act(() => result.current.onStart())

      expect(result.current.setup.settings.audioApps).toEqual([])
      expect(result.current.setup.settings.aspectRatio).toBe('source')
    })
  })

  it('offers no application list on a browser', () => {
    const { result } = setup()

    act(() => result.current.onStart())

    expect(result.current.setup.audioApps).toBeUndefined()
  })

  describe('the screens and windows', () => {
    const desktop = (sources = [gameSource, screenSource, browserSource]) =>
      setup({ kind: 'desktop', capabilities: { listSources: true }, sources })

    it('lists them when the dialog opens and picks the first screen, the kind of it going to the settings', async () => {
      const { result } = desktop()

      act(() => result.current.onStart())

      await waitFor(() => expect(result.current.setup.sources?.available).toHaveLength(3))
      expect(result.current.setup.sources?.selectedId).toBe('screen:0:0')
      expect(result.current.setup.settings.source).toBe('screen')
      expect(result.current.setup.systemPicker).toBe(false)
    })

    it('keeps the selected type when there is no source of that type', async () => {
      const { result } = desktop([gameSource])

      act(() => result.current.onStart())

      await waitFor(() => expect(result.current.setup.sources?.available).toHaveLength(1))
      expect(result.current.setup.sources?.selectedId).toBeNull()
    })

    it('chooses the first source of a type when its card is clicked', async () => {
      const { result } = desktop()
      act(() => result.current.onStart())
      await waitFor(() => expect(result.current.setup.sources?.selectedId).toBe('screen:0:0'))

      act(() => result.current.setup.onChange({ ...result.current.setup.settings, source: 'window' }))

      expect(result.current.setup.sources?.selectedId).toBe('window:590528:0')
      expect(result.current.setup.settings.source).toBe('window')
    })

    it('remembers one source per type while the dialog is open', async () => {
      const { result } = desktop()
      act(() => result.current.onStart())
      await waitFor(() => expect(result.current.setup.sources?.selectedId).toBe('screen:0:0'))
      act(() => result.current.setup.onChange({ ...result.current.setup.settings, source: 'window' }))
      act(() => result.current.setup.sources?.onSelect('window:262794:0'))
      act(() => result.current.setup.onChange({ ...result.current.setup.settings, source: 'screen' }))
      expect(result.current.setup.sources?.selectedId).toBe('screen:0:0')
      act(() => result.current.setup.onChange({ ...result.current.setup.settings, source: 'window' }))
      expect(result.current.setup.sources?.selectedId).toBe('window:262794:0')
    })

    it('ignores a source that is not on the list', async () => {
      const { result } = desktop()
      act(() => result.current.onStart())
      await waitFor(() => expect(result.current.setup.sources?.selectedId).toBe('screen:0:0'))

      act(() => result.current.setup.sources?.onSelect('window:1:0'))

      expect(result.current.setup.sources?.selectedId).toBe('screen:0:0')
    })

    it('starts the share with the chosen source', async () => {
      const { result } = desktop()
      act(() => result.current.onStart())
      await waitFor(() => expect(result.current.setup.sources?.selectedId).toBe('screen:0:0'))
      act(() => result.current.setup.onChange({ ...result.current.setup.settings, source: 'window' }))
      act(() => result.current.setup.sources?.onSelect('window:590528:0'))

      act(() => result.current.setup.onStart())

      expect(fakeShareController.start).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'window' }),
        'smooth',
        DIRECT,
        'window:590528:0',
      )
    })

    it('keeps the choice on refresh while it is still on the list', async () => {
      const { result } = desktop()
      act(() => result.current.onStart())
      await waitFor(() => expect(result.current.setup.sources?.selectedId).toBe('screen:0:0'))
      act(() => result.current.setup.onChange({ ...result.current.setup.settings, source: 'window' }))
      act(() => result.current.setup.sources?.onSelect('window:590528:0'))

      act(() => result.current.setup.sources?.onRefresh())
      await waitFor(() => expect(result.current.setup.sources?.available).toHaveLength(3))
      expect(result.current.setup.sources?.selectedId).toBe('window:590528:0')
    })

    it('leaves the choice to the system picker where the app cannot list, with no grid', () => {
      const { result } = setup({ kind: 'desktop', capabilities: { listSources: false } })

      act(() => result.current.onStart())
      expect(result.current.setup.sources).toBeUndefined()
      expect(result.current.setup.systemPicker).toBe(true)

      act(() => result.current.setup.onStart())
      expect(fakeShareController.start).toHaveBeenCalledWith(expect.anything(), 'smooth', DIRECT)
    })

    it('keeps the three kinds of the browser, which has its own picker', () => {
      const { result } = setup()

      act(() => result.current.onStart())

      expect(result.current.setup.sources).toBeUndefined()
      expect(result.current.setup.systemPicker).toBe(false)
    })
  })

  describe('the sound of the computer without the app', () => {
    const windows = () => setup({ kind: 'desktop', capabilities: { systemAudioWithoutApp: true } })

    it('offers it whichever source is shared, which the browser rule would not for a window', () => {
      const { result } = windows()

      act(() => result.current.onStart())
      act(() => result.current.setup.onChange({ ...result.current.setup.settings, source: 'window' }))

      expect(result.current.setup.audioSupport).toBe('systemWithoutApp')
      expect(result.current.setup.audioApps).toBeUndefined()
    })

    it('asks for the audio when the switch is on, with a window', () => {
      const { result } = windows()
      act(() => result.current.onStart())
      act(() =>
        result.current.setup.onChange({ ...result.current.setup.settings, source: 'window', includeAudio: true }),
      )

      act(() => result.current.setup.onStart())

      expect(fakeShareController.start).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'window', includeAudio: true, audioApps: [] }),
        'smooth',
        DIRECT,
      )
    })

    it('keeps the rule of the browser where the host does not have it', () => {
      const { result } = setup()

      act(() => result.current.onStart())

      expect(result.current.setup.audioSupport).not.toBe('systemWithoutApp')
    })
  })
})
