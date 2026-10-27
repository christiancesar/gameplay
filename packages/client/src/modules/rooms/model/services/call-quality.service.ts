import type { CallMedia } from '@/shared/media/call-media'

import { type CallQuality, type ConnectionSample, toCallQuality, toConnectionSample } from '../rules/call-quality'

type CallQualityDeps = {
  subscribeMedia: (handler: (media: CallMedia | null) => void) => () => void
  /** One reading of one connection, already summarized. */
  report: (quality: CallQuality) => void
  intervalMs?: number
}

const DEFAULT_INTERVAL_MS = 30_000

/**
 * While a call is on, reads the connection with each person every 30 seconds and reports how it is
 * going (round trip, jitter, loss, screen frame rate and size, relay or direct). Nothing about who.
 */
class CallQualityReporter {
  private readonly deps: CallQualityDeps
  private timer: ReturnType<typeof setInterval> | undefined
  private readonly previous = new Map<string, ConnectionSample>()
  private stopMedia: (() => void) | undefined

  constructor(deps: CallQualityDeps) {
    this.deps = deps
  }

  start(): void {
    this.stopMedia ??= this.deps.subscribeMedia((media) => this.follow(media))
  }

  stop(): void {
    this.stopMedia?.()
    this.stopMedia = undefined
    this.follow(null)
  }

  private follow(media: CallMedia | null): void {
    clearInterval(this.timer)
    this.timer = undefined
    this.previous.clear()
    if (!media) return
    this.timer = setInterval(() => void this.sample(media), this.deps.intervalMs ?? DEFAULT_INTERVAL_MS)
  }

  /** Exposed for specs; the timer calls it. */
  async sample(media: CallMedia): Promise<void> {
    const peerIds = media.transport.peerIds()
    for (const peerId of this.previous.keys()) if (!peerIds.includes(peerId)) this.previous.delete(peerId)

    for (const peerId of peerIds) {
      const sample = toConnectionSample(await media.transport.getConnectionStats(peerId))
      if (!sample) continue
      this.deps.report(toCallQuality(sample, this.previous.get(peerId)))
      this.previous.set(peerId, sample)
    }
  }
}

export { CallQualityReporter }
export type { CallQualityDeps }
