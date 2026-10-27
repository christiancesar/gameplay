import type { StreamQualityLevel } from '@gameplay/contracts'

type WatchStatus = 'idle' | 'waiting' | 'playing'

/** What reaches me, measured on my side: it can be lower than what the streamer sends. */
type ReceivedQuality = { width: number; height: number; fps: number; kbps: number }

type WatchSnapshot = {
  /** Who I asked to watch. */
  streamerId: string | null
  /** `waiting`: asked, no video yet. */
  status: WatchStatus
  /** The stream of the screen, once its video arrived. */
  stream: MediaStream | null
  /** Volume of the stream's audio for me, 0 to 100. */
  volume: number
  /** Null until two measures of the video arrived. */
  quality: ReceivedQuality | null
  /** The stream carries audio (the streamer shared it and the browser gave it). */
  hasAudio: boolean
  /** The quality I asked for; kept between streams like the volume. */
  level: StreamQualityLevel
  failed: boolean
}

type WatchStateStore = {
  getState(): WatchSnapshot
  setState(partial: Partial<WatchSnapshot>): void
}

const idleWatch: WatchSnapshot = {
  streamerId: null,
  status: 'idle',
  stream: null,
  volume: 100,
  quality: null,
  hasAudio: false,
  level: 'auto',
  failed: false,
}

export { idleWatch }
export type { ReceivedQuality, WatchSnapshot, WatchStateStore, WatchStatus }
