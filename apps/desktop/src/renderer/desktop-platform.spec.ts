import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ acquireScreen: vi.fn(), stopScreen: vi.fn(), openSystemAudioTrack: vi.fn() }))
vi.mock('@gameplay/client/platform', async (original) => ({
  ...(await original<typeof import('@gameplay/client/platform')>()),
  acquireScreen: mocks.acquireScreen,
  stopScreen: mocks.stopScreen,
}))
vi.mock('./system-audio-track', () => ({ openSystemAudioTrack: mocks.openSystemAudioTrack }))

import type { DesktopBridge } from '@gameplay/desktop-bridge/bridge'

import { createDesktopPlatform, telemetryFromBuild } from './desktop-platform'

const env = (values: Record<string, string>) =>
  ({ MODE: 'production', VITE_APP_VERSION: '1.2.3', ...values }) as unknown as ImportMetaEnv

describe('telemetryFromBuild', () => {
  it('is off without a DSN, named by the mode of the build and the version of the app', () => {
    expect(telemetryFromBuild(env({}))).toEqual({
      app: 'desktop',
      environment: 'production',
      release: 'gameplay-desktop@1.2.3',
      sentry: null,
      faro: null,
    })
  })

  it('sends to the Sentry project of the app, straight to Sentry, and never to Faro', () => {
    const telemetry = telemetryFromBuild(
      env({ VITE_SENTRY_DSN: 'https://key@o1.ingest.sentry.io/2', VITE_SENTRY_ENVIRONMENT: 'development' }),
    )

    expect(telemetry.sentry).toEqual({ dsn: 'https://key@o1.ingest.sentry.io/2', start: expect.any(Function) })
    expect(telemetry.environment).toBe('development')
    expect(telemetry.faro).toBeNull()
  })
})

describe('createDesktopPlatform', () => {
  const bridge = {} as DesktopBridge

  it('lets the user choose the server in development', () => {
    const platform = createDesktopPlatform({
      bridge,
      server: null,
      serverFixed: false,
      appAudio: false,
      listSources: false,
      systemAudio: false,
    })

    expect(platform.server.chooser?.current()).toBeNull()
  })

  it('has nothing to choose when the build is tied to a server', () => {
    const platform = createDesktopPlatform({
      bridge,
      server: 'https://play.example.com',
      serverFixed: true,
      appAudio: false,
      listSources: false,
      systemAudio: false,
    })

    expect(platform.server.chooser).toBeUndefined()
    expect(platform.server.baseUrl()).toBe('https://play.example.com')
  })

  describe('the screens and windows', () => {
    const source = { id: 'window:7:0', name: 'Game', kind: 'window' as const, thumbnail: null, appIcon: null }
    const listing = () =>
      ({
        'capture:list-sources': vi.fn(async () => [source]),
        'capture:select-source': vi.fn(async () => undefined),
      }) as unknown as DesktopBridge

    it('lists them through the main process where the app can, and says so', async () => {
      const platform = createDesktopPlatform({
        bridge: listing(),
        server: null,
        serverFixed: false,
        appAudio: false,
        listSources: true,
        systemAudio: false,
      })

      expect(platform.capabilities.listSources).toBe(true)
      expect(await platform.capture.listSources()).toEqual([source])
    })

    it('lists nothing and does not ask the main process where the system picker chooses', async () => {
      const bridge = listing()
      const platform = createDesktopPlatform({
        bridge,
        server: null,
        serverFixed: false,
        appAudio: false,
        listSources: false,
        systemAudio: false,
      })

      expect(platform.capabilities.listSources).toBe(false)
      expect(await platform.capture.listSources()).toEqual([])
      expect(bridge['capture:list-sources']).not.toHaveBeenCalled()
    })

    it('tells the main process the source before it asks for the screen', async () => {
      const bridge = listing()
      const platform = createDesktopPlatform({
        bridge,
        server: null,
        serverFixed: false,
        appAudio: false,
        listSources: true,
        systemAudio: false,
      })

      await platform.capture.start({ options: { video: true }, sourceId: 'window:7:0' }).catch(() => undefined)

      expect(bridge['capture:select-source']).toHaveBeenCalledWith('window:7:0')
    })

    it('does not talk to the main process about sources where the system picker chooses', async () => {
      const bridge = listing()
      const platform = createDesktopPlatform({
        bridge,
        server: null,
        serverFixed: false,
        appAudio: false,
        listSources: false,
        systemAudio: false,
      })

      await platform.capture.start({ options: { video: true }, sourceId: null }).catch(() => undefined)

      expect(bridge['capture:select-source']).not.toHaveBeenCalled()
    })
  })

  describe('the sound of the computer without the app', () => {
    const track = { id: 'system-audio' } as MediaStreamTrack
    const capture = () => ({ stream: { addTrack: vi.fn() }, video: { id: 'video' } })
    const platform = (systemAudio: boolean, bridge = {} as DesktopBridge) =>
      createDesktopPlatform({
        bridge,
        server: null,
        serverFixed: false,
        appAudio: false,
        listSources: false,
        systemAudio,
      })

    it('says the host shares it only where the capture helper is', () => {
      expect(platform(true).capabilities.systemAudioWithoutApp).toBe(true)
      expect(platform(false).capabilities.systemAudioWithoutApp).toBe(false)
    })

    it('takes the video without audio and adds the track of the helper when audio is asked', async () => {
      const taken = capture()
      mocks.acquireScreen.mockResolvedValue({ ok: true, capture: taken })
      mocks.openSystemAudioTrack.mockResolvedValue({ track, close: vi.fn() })

      const result = await platform(true).capture.start({ options: { video: true, audio: true }, sourceId: null })

      expect(mocks.acquireScreen).toHaveBeenCalledWith({ video: true, audio: false })
      expect(taken.stream.addTrack).toHaveBeenCalledWith(track)
      expect(result).toMatchObject({ ok: true, capture: { audio: track } })
    })

    it('shares the video alone when the helper does not start', async () => {
      const taken = capture()
      mocks.acquireScreen.mockResolvedValue({ ok: true, capture: taken })
      mocks.openSystemAudioTrack.mockResolvedValue(null)

      const result = await platform(true).capture.start({ options: { video: true, audio: true }, sourceId: null })

      expect(taken.stream.addTrack).not.toHaveBeenCalled()
      expect(result).toMatchObject({ ok: true, capture: taken })
    })

    it('does not start the helper when no audio is asked', async () => {
      mocks.openSystemAudioTrack.mockClear()
      mocks.acquireScreen.mockResolvedValue({ ok: true, capture: capture() })

      await platform(true).capture.start({ options: { video: true }, sourceId: null })

      expect(mocks.openSystemAudioTrack).not.toHaveBeenCalled()
    })

    it('lets go of the track when the share stops', async () => {
      const close = vi.fn()
      mocks.acquireScreen.mockResolvedValue({ ok: true, capture: capture() })
      mocks.openSystemAudioTrack.mockResolvedValue({ track, close })
      const bridge = { 'audio:stop': vi.fn(async () => undefined) } as unknown as DesktopBridge
      const host = platform(true, bridge)
      const result = await host.capture.start({ options: { video: true, audio: true }, sourceId: null })

      if (result.ok) host.capture.stop(result.capture)

      expect(close).toHaveBeenCalledOnce()
    })
  })
})
