import { describe, expect, it, vi } from 'vitest'

import { createFakeMicLevelEnv } from '../../view-models/test/fake-mic-level-env'

import { createMicLevelMeter } from './mic-level.service'

describe('mic level meter', () => {
  it('opens the chosen device and reports a level per frame', async () => {
    const fake = createFakeMicLevelEnv(128)
    const levels: number[] = []
    await createMicLevelMeter(fake.env).start('mic-1', (level) => levels.push(level))
    expect(fake.env.getUserMedia).toHaveBeenCalledWith({ audio: { deviceId: { exact: 'mic-1' } } })
    expect(fake.source.connect).toHaveBeenCalledWith(fake.analyser)
    expect(levels).toEqual([0])

    fake.analyser.getByteTimeDomainData.mockImplementation((array: Uint8Array) => {
      array.forEach((_, index) => (array[index] = index % 2 ? 200 : 56))
      return array
    })
    fake.runFrame()
    expect(levels).toHaveLength(2)
    expect(levels[1]).toBeGreaterThan(0.5)
  })

  it('uses the system default without a device id', async () => {
    const fake = createFakeMicLevelEnv()
    await createMicLevelMeter(fake.env).start(undefined, vi.fn())
    expect(fake.env.getUserMedia).toHaveBeenCalledWith({ audio: true })
  })

  it('stops the frames, the tracks and the context once', async () => {
    const fake = createFakeMicLevelEnv()
    const onLevel = vi.fn()
    const stop = await createMicLevelMeter(fake.env).start(undefined, onLevel)
    stop()
    stop()
    fake.runFrame()
    expect(onLevel).toHaveBeenCalledTimes(1)
    expect(fake.track.stop).toHaveBeenCalledTimes(1)
    expect(fake.context.close).toHaveBeenCalledTimes(1)
    expect(fake.env.cancelFrame).toHaveBeenCalledTimes(1)
  })

  it('rejects when the microphone cannot be opened', async () => {
    const fake = createFakeMicLevelEnv()
    vi.mocked(fake.env.getUserMedia).mockRejectedValue(new DOMException('no', 'NotAllowedError'))
    await expect(createMicLevelMeter(fake.env).start(undefined, vi.fn())).rejects.toThrow()
  })
})
