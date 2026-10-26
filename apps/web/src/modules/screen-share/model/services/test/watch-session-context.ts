import { idleWatch, type WatchSnapshot } from '../../entities/watch'
import { WatchSession } from '../watch-session.service'
import { FakeCallMediaSource } from './fake-call-media-source'
import { FakeSessionStore } from './fake-session-store'
import { FakeStreamRealtime } from './fake-stream-realtime'

/** A watch session wired to fakes. */
function makeWatchSessionContext() {
  const realtime = new FakeStreamRealtime()
  const store = new FakeSessionStore<WatchSnapshot>({ ...idleWatch })
  const source = new FakeCallMediaSource()
  const session = new WatchSession({ realtime, store, subscribeMedia: source.subscribe, pollMs: 1000 })
  session.attach()
  return { session, realtime, store, source }
}

export { makeWatchSessionContext }
