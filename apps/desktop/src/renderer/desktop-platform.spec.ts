import { describe, expect, it, vi } from 'vitest'

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
      })

      await platform.capture.start({ options: { video: true }, sourceId: null }).catch(() => undefined)

      expect(bridge['capture:select-source']).not.toHaveBeenCalled()
    })
  })
})
