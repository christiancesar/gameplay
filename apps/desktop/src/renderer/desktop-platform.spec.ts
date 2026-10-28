import { describe, expect, it } from 'vitest'

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
    const platform = createDesktopPlatform({ bridge, server: null, serverFixed: false, appAudio: false })

    expect(platform.server.chooser?.current()).toBeNull()
  })

  it('has nothing to choose when the build is tied to a server', () => {
    const platform = createDesktopPlatform({
      bridge,
      server: 'https://play.example.com',
      serverFixed: true,
      appAudio: false,
    })

    expect(platform.server.chooser).toBeUndefined()
    expect(platform.server.baseUrl()).toBe('https://play.example.com')
  })
})
