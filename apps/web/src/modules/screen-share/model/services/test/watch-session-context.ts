import type { StreamMode } from '@gameplay/contracts'
import { vi } from 'vitest'

import type { TrackEventLike } from '@/shared/media/browser-media'
import type { StatsRecord } from '@/shared/media/media-transport'
import { fakeStream } from '@/shared/media/test/media-fakes'

import { idleWatch, type WatchSnapshot } from '../../entities/watch'
import { WatchSession } from '../watch-session.service'
import { FakeCallMediaSource } from './fake-call-media-source'
import { FakeSessionStore } from './fake-session-store'
import { FakeStreamRealtime } from './fake-stream-realtime'

/** A watch session wired to fakes. `modes` says how each streamer sends; `sfu` drives the SFU side. */
function makeWatchSessionContext() {
  const realtime = new FakeStreamRealtime()
  const store = new FakeSessionStore<WatchSnapshot>({ ...idleWatch })
  const source = new FakeCallMediaSource()
  const modes: Record<string, StreamMode> = {}
  const sfu = {
    failing: false,
    stats: [] as StatsRecord[],
    close: vi.fn(),
    /** Delivers a track as the SFU connection would. */
    deliver: (_event: TrackEventLike) => undefined as void,
  }
  const watchFromSfu = vi.fn(async (_streamerId: string, _layer: string, onTrack: (event: TrackEventLike) => void) => {
    if (sfu.failing) throw new Error('SFU down')
    sfu.deliver = onTrack
    return {
      close: sfu.close,
      getStats: async () => ({ forEach: (callback: (stats: StatsRecord) => void) => sfu.stats.forEach(callback) }),
    }
  })
  const session = new WatchSession({
    realtime,
    store,
    subscribeMedia: source.subscribe,
    streamModeOf: (userId) => modes[userId] ?? (userId ? 'mesh' : null),
    watchFromSfu,
    createMediaStream: (tracks) => fakeStream(tracks),
    pollMs: 1000,
  })
  session.attach()
  return { session, realtime, store, source, modes, sfu, watchFromSfu }
}

export { makeWatchSessionContext }
