import { vi } from 'vitest'

import type { ScreenCaptureResult } from '@/shared/media/screen-capture'

import { idleShare, type ShareSnapshot } from '../../entities/share'
import { ShareSession } from '../share-session.service'
import { FakeCallMediaSource } from './fake-call-media-source'
import { FakeSessionStore } from './fake-session-store'
import { FakeStreamRealtime } from './fake-stream-realtime'
import { makeCapture } from './screen-seed'

type Capture = ReturnType<typeof makeCapture>

/** A share session wired to fakes. `picker` decides what the browser's picker answers. */
function makeShareSessionContext() {
  const realtime = new FakeStreamRealtime()
  const store = new FakeSessionStore<ShareSnapshot>({ ...idleShare })
  const source = new FakeCallMediaSource()
  const captures: Capture[] = []
  const picker = { answer: 'pick' as 'pick' | 'cancel' | 'unsupported' | 'fail', withAudio: true }

  const acquireScreen = vi.fn(async (): Promise<ScreenCaptureResult> => {
    if (picker.answer === 'cancel') return { ok: false, reason: 'cancelled' }
    if (picker.answer === 'unsupported') return { ok: false, reason: 'unsupported' }
    if (picker.answer === 'fail') return { ok: false, reason: 'failed' }
    const capture = makeCapture(picker.withAudio)
    captures.push(capture)
    return { ok: true, capture }
  })
  const stopScreen = vi.fn()
  const report = vi.fn()
  const session = new ShareSession({
    realtime,
    store,
    subscribeMedia: source.subscribe,
    acquireScreen,
    stopScreen,
    pollMs: 1000,
    report,
  })
  session.attach()

  return {
    session,
    realtime,
    store,
    source,
    picker,
    captures,
    acquireScreen,
    stopScreen,
    report,
    get capture() {
      return captures[captures.length - 1]
    },
  }
}

export { makeShareSessionContext }
