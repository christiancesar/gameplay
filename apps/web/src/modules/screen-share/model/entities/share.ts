import type { StreamMode } from '@gameplay/contracts'

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

/**
 * Why a share did not start or changed, for a toast. `no-audio`: it started, but the browser gave no audio.
 * `fell-back`: the SFU failed and the share went Direct (Mesh). `disabled`: the platform admin turned the
 * mode off and the API stopped the share.
 */
type ShareNotice = 'unsupported' | 'failed' | 'start-failed' | 'not-in-call' | 'no-audio' | 'fell-back' | 'disabled'

/**
 * The audio of the running share. `off`: not asked. `missing`: asked, the browser gave none.
 * `silent` / `active`: there is a track, quiet or with sound right now.
 */
type ShareAudio = 'off' | 'missing' | 'silent' | 'active'

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
  /** The running capture; null unless live. */
  preview: SharePreview | null
  audio: ShareAudio
  /** How the running share reaches the viewers; null unless live. */
  mode: StreamMode | null
  /** What goes up to the SFU (its largest layer); null in Mesh, or until two samples. */
  uplink: ViewerStat | null
  notice: ShareNotice | null
}

/** What the captured surface is, as the browser reports it (`displaySurface`). */
type ShareSurface = 'monitor' | 'window' | 'browser' | 'unknown'

/** The local capture, for the streamer's own preview. Nothing is sent for it. */
type SharePreview = { stream: MediaStream; surface: ShareSurface }

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
  preview: null,
  audio: 'off',
  mode: null,
  uplink: null,
  notice: null,
}

export { SHARE_SOURCES, defaultShareSettings, idleShare }
export type {
  ShareAudio,
  ShareFps,
  SharePriority,
  ShareNotice,
  ShareResolution,
  ShareSettings,
  ShareSnapshot,
  ShareSource,
  ShareStateStore,
  SharePreview,
  ShareStatus,
  ShareSurface,
  ViewerStat,
}
