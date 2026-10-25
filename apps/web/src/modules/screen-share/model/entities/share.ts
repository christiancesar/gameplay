const SHARE_SOURCES = ['screen', 'window', 'tab'] as const
/** Kind of surface; becomes the `displaySurface` hint. The exact choice happens in the browser's picker. */
type ShareSource = (typeof SHARE_SOURCES)[number]
type ShareResolution = '720p' | '1080p'
type ShareFps = 30 | 60

type ShareSettings = {
  source: ShareSource
  resolution: ShareResolution
  fps: ShareFps
  includeAudio: boolean
}

/** `smooth` keeps the frame rate and lets the resolution drop first (games); `sharp` does the opposite (text). */
type SharePriority = 'smooth' | 'sharp'

type ShareStatus = 'idle' | 'picking' | 'live'

/** Why a share did not start, for a toast. */
type ShareNotice = 'unsupported' | 'failed' | 'start-failed' | 'not-in-call'

/** What one viewer receives, measured on the sender. */
type ViewerStat = {
  width: number
  height: number
  fps: number
  kbps: number
  limitation: 'none' | 'bandwidth' | 'cpu' | 'other'
}

type ShareSnapshot = {
  status: ShareStatus
  settings: ShareSettings
  priority: SharePriority
  /** Who asked to watch, in the order they asked. */
  viewerIds: string[]
  /** Last measure of each viewer; missing until the sender has two samples. */
  stats: Record<string, ViewerStat>
  /** Height and fps the captured source really has, to not ask more of a small window than it has. */
  source: { height: number; fps: number } | null
  notice: ShareNotice | null
}

type ShareStateStore = {
  getState(): ShareSnapshot
  setState(partial: Partial<ShareSnapshot>): void
}

const defaultShareSettings: ShareSettings = { source: 'screen', resolution: '1080p', fps: 30, includeAudio: false }

const idleShare: ShareSnapshot = {
  status: 'idle',
  settings: defaultShareSettings,
  priority: 'smooth',
  viewerIds: [],
  stats: {},
  source: null,
  notice: null,
}

export { SHARE_SOURCES, defaultShareSettings, idleShare }
export type {
  ShareFps,
  SharePriority,
  ShareNotice,
  ShareResolution,
  ShareSettings,
  ShareSnapshot,
  ShareSource,
  ShareStateStore,
  ShareStatus,
  ViewerStat,
}
