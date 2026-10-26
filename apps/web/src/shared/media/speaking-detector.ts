import type { LevelMeter } from './audio-engine'

/** RMS level of a voice stream above which someone counts as talking. */
const SPEAKING_THRESHOLD = 0.02
/** Keeps the indicator on through the pauses between words. */
const SPEAKING_HOLD_MS = 300
const POLL_INTERVAL_MS = 100

type SpeakingDetectorOptions = {
  createMeter: (stream: MediaStream) => LevelMeter
  /** Called only when someone starts or stops talking, with everyone who is talking now. */
  onChange: (speakingIds: readonly string[]) => void
  threshold?: number
  holdMs?: number
  intervalMs?: number
  now?: () => number
}

type Watched = { meter: LevelMeter; lastLoudAt: number; speaking: boolean }

/**
 * Polls the level of each watched stream a few times per second. Throttled by design: the poll is
 * the only clock, and a change is reported once, not on every sample.
 */
class SpeakingDetector {
  private readonly options: SpeakingDetectorOptions
  private readonly watched = new Map<string, Watched>()
  private timer: ReturnType<typeof setInterval> | undefined

  constructor(options: SpeakingDetectorOptions) {
    this.options = options
  }

  watch(id: string, stream: MediaStream): void {
    this.unwatch(id)
    this.watched.set(id, {
      meter: this.options.createMeter(stream),
      lastLoudAt: -Infinity,
      speaking: false,
    })
    this.timer ??= setInterval(() => this.poll(), this.options.intervalMs ?? POLL_INTERVAL_MS)
  }

  unwatch(id: string): void {
    const entry = this.watched.get(id)
    if (!entry) return
    entry.meter.dispose()
    this.watched.delete(id)
    if (entry.speaking) this.options.onChange(this.speakingIds())
    if (this.watched.size === 0) this.stopTimer()
  }

  dispose(): void {
    for (const entry of this.watched.values()) entry.meter.dispose()
    this.watched.clear()
    this.stopTimer()
  }

  private poll() {
    const { threshold = SPEAKING_THRESHOLD, holdMs = SPEAKING_HOLD_MS, now = Date.now } = this.options
    const time = now()
    let changed = false
    for (const entry of this.watched.values()) {
      if (entry.meter.read() >= threshold) entry.lastLoudAt = time
      const speaking = time - entry.lastLoudAt < holdMs
      if (speaking !== entry.speaking) {
        entry.speaking = speaking
        changed = true
      }
    }
    if (changed) this.options.onChange(this.speakingIds())
  }

  private speakingIds() {
    return [...this.watched].filter(([, entry]) => entry.speaking).map(([id]) => id)
  }

  private stopTimer() {
    clearInterval(this.timer)
    this.timer = undefined
  }
}

export { POLL_INTERVAL_MS, SPEAKING_HOLD_MS, SPEAKING_THRESHOLD, SpeakingDetector }
export type { SpeakingDetectorOptions }
