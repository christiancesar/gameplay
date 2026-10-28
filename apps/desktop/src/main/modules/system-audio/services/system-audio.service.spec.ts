import { describe, expect, it } from 'vitest'

import { FakeSystemAudioProvider } from '../test/fake-system-audio.provider'
import { SystemAudioService } from './system-audio.service'

const setup = (options?: ConstructorParameters<typeof FakeSystemAudioProvider>[0]) => {
  const provider = new FakeSystemAudioProvider(options)
  const received: Uint8Array[] = []
  const service = new SystemAudioService(provider, (chunk) => received.push(chunk))
  return { provider, service, received }
}

describe('SystemAudioService', () => {
  it('says what the system can do', () => {
    expect(setup().service.available()).toBe(true)
    expect(setup({ available: false }).service.available()).toBe(false)
  })

  it('starts the capture and hands the PCM to the sink', async () => {
    const { provider, service, received } = setup()

    expect(await service.start()).toBe(true)
    provider.data(new Uint8Array([1, 2, 3, 4]))

    expect(received).toEqual([new Uint8Array([1, 2, 3, 4])])
  })

  it('does not start where the system cannot, nor when the provider fails', async () => {
    const without = setup({ available: false })
    expect(await without.service.start()).toBe(false)
    expect(without.provider.starts).toBe(0)

    expect(await setup({ starts: false }).service.start()).toBe(false)
  })

  it('stops a capture that runs before it starts another', async () => {
    const { provider, service } = setup()

    await service.start()
    await service.start()

    expect(provider.stops).toBe(1)
    expect(provider.starts).toBe(2)
  })

  it('stops once after a capture, and does nothing when none runs', async () => {
    const { provider, service } = setup()

    service.stop()
    expect(provider.stops).toBe(0)

    await service.start()
    service.stop()
    service.stop()
    expect(provider.stops).toBe(1)
  })

  it('knows the capture ended on its own, so the next stop does not touch the provider', async () => {
    const { provider, service } = setup()
    await service.start()

    provider.end()
    service.stop()

    expect(provider.stops).toBe(0)
  })
})
