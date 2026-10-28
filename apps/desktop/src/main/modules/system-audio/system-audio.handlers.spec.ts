import { describe, expect, it, vi } from 'vitest'

import { SystemAudioService } from './services/system-audio.service'
import { systemAudioHandlers } from './system-audio.handlers'
import { FakeSystemAudioProvider } from './test/fake-system-audio.provider'

const setup = (options?: ConstructorParameters<typeof FakeSystemAudioProvider>[0]) => {
  const provider = new FakeSystemAudioProvider(options)
  const telemetry = { measure: vi.fn() } as never
  const handlers = systemAudioHandlers(new SystemAudioService(provider, vi.fn()), telemetry)
  return { provider, handlers, measure: (telemetry as { measure: ReturnType<typeof vi.fn> }).measure }
}

describe('systemAudioHandlers', () => {
  it('answers whether the system can', () => {
    expect(setup().handlers['system-audio:available'](undefined)).toBe(true)
    expect(setup({ available: false }).handlers['system-audio:available'](undefined)).toBe(false)
  })

  it('starts the capture and reports whether it started', async () => {
    const ok = setup()
    expect(await ok.handlers['system-audio:start'](undefined)).toBe(true)
    expect(ok.measure).toHaveBeenCalledWith({
      name: 'system_audio_start',
      values: { started: 1 },
      attributes: { scope: 'system' },
    })

    const failed = setup({ starts: false })
    expect(await failed.handlers['system-audio:start'](undefined)).toBe(false)
    expect(failed.measure).toHaveBeenCalledWith({
      name: 'system_audio_start',
      values: { started: 0 },
      attributes: { scope: 'system' },
    })
  })

  it('starts for a window and says so to the telemetry', async () => {
    const { handlers, provider, measure } = setup()

    await handlers['system-audio:start']({ scope: 'window', sourceId: 'window:7:0' })

    expect(provider.scopes).toEqual([{ scope: 'window', sourceId: 'window:7:0' }])
    expect(measure).toHaveBeenCalledWith(expect.objectContaining({ attributes: { scope: 'window' } }))
  })

  it('stops the capture', async () => {
    const { handlers, provider } = setup()

    await handlers['system-audio:start'](undefined)
    handlers['system-audio:stop'](undefined)

    expect(provider.stops).toBe(1)
  })
})
