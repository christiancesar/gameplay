import { vi } from 'vitest'

import type { ScreenCaptureResult } from '@/shared/media/screen-capture'
import type { OutgoingTrack } from '@/shared/media/sfu-connection'

import { idleShare, type ShareSnapshot } from '../../entities/share'
import { ShareSession, type ShareSessionDeps } from '../share-session.service'
import { FakeCallMediaSource } from './fake-call-media-source'
import { FakeSessionStore } from './fake-session-store'
import { FakeSfuPublication } from './fake-sfu-publication'
import { FakeStreamRealtime } from './fake-stream-realtime'
import { makeCapture } from './screen-seed'

type Capture = ReturnType<typeof makeCapture>
type AcquireArgs = Parameters<ShareSessionDeps['acquireScreen']>

/** A share session wired to fakes. `picker` decides what the browser's picker answers. */
function makeShareSessionContext() {
  const realtime = new FakeStreamRealtime()
  const store = new FakeSessionStore<ShareSnapshot>({ ...idleShare })
  const source = new FakeCallMediaSource()
  const captures: Capture[] = []
  const picker = { answer: 'pick' as 'pick' | 'cancel' | 'unsupported' | 'fail', withAudio: true }

  const acquireScreen = vi.fn(async (..._asked: AcquireArgs): Promise<ScreenCaptureResult> => {
    if (picker.answer === 'cancel') return { ok: false, reason: 'cancelled' }
    if (picker.answer === 'unsupported') return { ok: false, reason: 'unsupported' }
    if (picker.answer === 'fail') return { ok: false, reason: 'failed' }
    const capture = makeCapture(picker.withAudio)
    captures.push(capture)
    return { ok: true, capture }
  })
  const stopScreen = vi.fn()
  const sfu = { failing: false, publications: [] as FakeSfuPublication[] }
  const publishToSfu = vi.fn(async (tracks: OutgoingTrack[]) => {
    if (sfu.failing) throw new Error('SFU down')
    const publication = new FakeSfuPublication(tracks[0]?.encodings)
    sfu.publications.push(publication)
    return publication
  })
  const report = vi.fn()
  const diagnostics = { enabled: true, record: vi.fn() }
  const session = new ShareSession({
    realtime,
    store,
    subscribeMedia: source.subscribe,
    acquireScreen,
    stopScreen,
    publishToSfu,
    pollMs: 1000,
    report,
    diagnostics,
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
    diagnostics,
    sfu,
    publishToSfu,
    get capture() {
      return captures[captures.length - 1]
    },
  }
}

export { makeShareSessionContext }
