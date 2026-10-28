import { describe, expect, it } from 'vitest'

import { FakeAppAudioProvider } from '../test/fake-app-audio.provider'
import { AppAudioService } from './app-audio.service'

describe('AppAudioService', () => {
  it('lists the applications by name, and nothing when the system cannot', () => {
    const playing = [
      { name: 'spotify', binary: 'spotify' },
      { name: 'Firefox', binary: 'firefox' },
    ]

    expect(new AppAudioService(new FakeAppAudioProvider({ playing })).list().map((app) => app.name)).toEqual([
      'Firefox',
      'spotify',
    ])
    expect(new AppAudioService(new FakeAppAudioProvider({ available: false, playing })).list()).toEqual([])
  })

  it('shares only when the system can, and tells whether it did', () => {
    const provider = new FakeAppAudioProvider()
    const service = new AppAudioService(provider)

    expect(service.share({ mode: 'apps', apps: ['spotify'] })).toBe(true)
    expect(provider.shared).toEqual([{ mode: 'apps', apps: ['spotify'] }])

    const without = new FakeAppAudioProvider({ available: false })
    expect(new AppAudioService(without).share({ mode: 'system' })).toBe(false)
    expect(without.shared).toEqual([])
  })

  it('takes the microphone down once after a share, and does nothing when none was made', () => {
    const provider = new FakeAppAudioProvider()
    const service = new AppAudioService(provider)

    service.stop()
    expect(provider.stops).toBe(0)

    service.share({ mode: 'system' })
    service.stop()
    service.stop()
    expect(provider.stops).toBe(1)
  })
})
