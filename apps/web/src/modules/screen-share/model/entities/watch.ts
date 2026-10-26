type WatchStatus = 'idle' | 'waiting' | 'playing'

type WatchSnapshot = {
  /** Who I asked to watch. */
  streamerId: string | null
  /** `waiting`: asked, no video yet. */
  status: WatchStatus
  /** The stream of the screen, once its video arrived. */
  stream: MediaStream | null
  /** Volume of the stream's audio for me, 0 to 100. */
  volume: number
  failed: boolean
}

type WatchStateStore = {
  getState(): WatchSnapshot
  setState(partial: Partial<WatchSnapshot>): void
}

const idleWatch: WatchSnapshot = { streamerId: null, status: 'idle', stream: null, volume: 100, failed: false }

export { idleWatch }
export type { WatchSnapshot, WatchStateStore, WatchStatus }
