import { describe, expect, it } from 'vitest'

import { FakeMainTelemetry } from '../telemetry/test/fake-main-telemetry'
import { audioHandlers } from './audio.handlers'
import { AppAudioService } from './services/app-audio.service'
import { FakeAppAudioProvider } from './test/fake-app-audio.provider'

describe('audioHandlers', () => {
  it('reports whether a share linked, by mode, and returns what the service did', () => {
    const telemetry = new FakeMainTelemetry()
    const working = audioHandlers(new AppAudioService(new FakeAppAudioProvider()), telemetry)
    const broken = audioHandlers(new AppAudioService(new FakeAppAudioProvider({ available: false })), telemetry)

    expect(working['audio:share']({ mode: 'apps', apps: ['spotify'] })).toBe(true)
    expect(broken['audio:share']({ mode: 'system' })).toBe(false)

    expect(telemetry.measurements).toEqual([
      { name: 'audio_share', values: { linked: 1 }, attributes: { mode: 'apps' } },
      { name: 'audio_share', values: { linked: 0 }, attributes: { mode: 'system' } },
    ])
  })
})
