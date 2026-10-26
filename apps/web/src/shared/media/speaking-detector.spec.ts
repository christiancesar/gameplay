import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SPEAKING_HOLD_MS, SPEAKING_THRESHOLD, SpeakingDetector } from './speaking-detector'
import { fakeStream } from './test/media-fakes'

describe('SpeakingDetector', () => {
  let levels: Record<string, number>
  let disposed: string[]
  let changes: (readonly string[])[]
  let detector: SpeakingDetector

  beforeEach(() => {
    vi.useFakeTimers()
    levels = {}
    disposed = []
    changes = []
    let next = 0
    const ids: string[] = []
    detector = new SpeakingDetector({
      // The meter of the n-th watched stream reads levels[ids[n]].
      createMeter: () => {
        const id = ids[next++]
        return { read: () => levels[id] ?? 0, dispose: () => disposed.push(id) }
      },
      onChange: (speaking) => changes.push(speaking),
      now: () => Date.now(),
    })
    const watch = detector.watch.bind(detector)
    detector.watch = (id, stream) => {
      ids.push(id)
      watch(id, stream)
    }
  })
  afterEach(() => {
    detector.dispose()
    vi.useRealTimers()
  })

  it('reports who starts talking, once', () => {
    detector.watch('u1', fakeStream())
    vi.advanceTimersByTime(300)
    expect(changes).toEqual([])
    levels.u1 = SPEAKING_THRESHOLD * 2
    vi.advanceTimersByTime(500)
    expect(changes).toEqual([['u1']])
  })

  it('keeps the indicator through short pauses and drops it after the hold time', () => {
    levels.u1 = SPEAKING_THRESHOLD * 2
    detector.watch('u1', fakeStream())
    vi.advanceTimersByTime(100)
    levels.u1 = 0
    vi.advanceTimersByTime(SPEAKING_HOLD_MS - 150)
    expect(changes).toEqual([['u1']])
    vi.advanceTimersByTime(300)
    expect(changes).toEqual([['u1'], []])
  })

  it('tracks several people', () => {
    levels.u1 = 1
    levels.u2 = 1
    detector.watch('u1', fakeStream())
    detector.watch('u2', fakeStream())
    vi.advanceTimersByTime(100)
    expect(changes.at(-1)).toEqual(['u1', 'u2'])
  })

  it('stops reporting someone who is unwatched while talking', () => {
    levels.u1 = 1
    detector.watch('u1', fakeStream())
    vi.advanceTimersByTime(100)
    detector.unwatch('u1')
    expect(changes.at(-1)).toEqual([])
    expect(disposed).toEqual(['u1'])
  })

  it('stops polling when nobody is watched or after dispose', () => {
    detector.watch('u1', fakeStream())
    detector.unwatch('u1')
    expect(vi.getTimerCount()).toBe(0)
    detector.watch('u2', fakeStream())
    detector.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})
