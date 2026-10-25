import { beforeEach, describe, expect, it } from 'vitest'

import { WebAudioEngine } from './audio-engine'
import { FakeAudioContext, FakeAudioElement } from './test/fake-audio'
import { fakeStream } from './test/media-fakes'

describe('WebAudioEngine', () => {
  let context: FakeAudioContext
  let elements: FakeAudioElement[]
  let engine: WebAudioEngine

  beforeEach(() => {
    context = new FakeAudioContext()
    elements = []
    engine = new WebAudioEngine({
      createContext: () => context,
      createElement: () => {
        const element = new FakeAudioElement()
        elements.push(element)
        return element
      },
    })
  })

  // gains[0] is the master; each peer adds one.
  const master = () => context.gains[0]

  it('starts the context and the output element', () => {
    expect(context.resume).toHaveBeenCalled()
    expect(elements[0].play).toHaveBeenCalled()
    expect(elements[0].srcObject).toBe(context.destination.stream)
  })

  it('plays a peer through its own gain into the master, with a muted element attached', () => {
    const stream = fakeStream()
    engine.addStream('u2', stream)
    expect(elements[1]).toMatchObject({ muted: true, srcObject: stream })
    expect(context.gains[1].connected).toEqual([master()])
  })

  it('applies a volume set before the stream arrived', () => {
    engine.setVolume('u2', 1.5)
    engine.addStream('u2', fakeStream())
    expect(context.gains[1].gain.value).toBe(1.5)
    engine.setVolume('u2', 0.25)
    expect(context.gains[1].gain.value).toBe(0.25)
  })

  it('deafen silences the master and restores it', () => {
    engine.setDeafened(true)
    expect(master().gain.value).toBe(0)
    engine.setDeafened(false)
    expect(master().gain.value).toBe(1)
  })

  it('removes a peer', () => {
    engine.addStream('u2', fakeStream())
    engine.removeStream('u2')
    expect(context.gains[1].disconnected).toBe(true)
    expect(elements[1].pause).toHaveBeenCalled()
    expect(elements[1].srcObject).toBeNull()
  })

  it('picks the output device, and says so when the browser cannot', async () => {
    await expect(engine.setSinkId('speaker-1')).resolves.toBe(true)
    expect(elements[0].setSinkId).toHaveBeenCalledWith('speaker-1')
    await engine.setSinkId(undefined)
    expect(elements[0].setSinkId).toHaveBeenLastCalledWith('')
    elements[0].setSinkId.mockRejectedValueOnce(new Error('gone'))
    await expect(engine.setSinkId('x')).resolves.toBe(false)
    delete (elements[0] as { setSinkId?: unknown }).setSinkId
    await expect(engine.setSinkId('x')).resolves.toBe(false)
  })

  it('measures the level of a stream as RMS', () => {
    const meter = engine.createMeter(fakeStream())
    context.analysers[0].level = 0.5
    expect(meter.read()).toBeCloseTo(0.5)
    meter.dispose()
    expect(context.analysers[0].disconnected).toBe(true)
  })

  it('closes the context on dispose', () => {
    engine.addStream('u2', fakeStream())
    engine.dispose()
    expect(context.close).toHaveBeenCalled()
    engine.addStream('u3', fakeStream())
    expect(context.gains).toHaveLength(2)
  })
})
