import type { ViewerStat } from '../entities/share'
import type { ShareFps, ShareResolution } from '../entities/share'

/** A measure within 5 % of the target counts as on target (the meters of the panel use the same slack). */
const ON_TARGET_RATIO = 0.95

const TARGET_HEIGHT: Record<ShareResolution, number> = { '720p': 720, '1080p': 1080 }

type QualityLimitation = ViewerStat['limitation']

type Target = { resolution: ShareResolution; fps: ShareFps }
type Source = { height: number; fps: number } | null

type QualitySummary = {
  /** The worst viewer's resolution and rate, with the upload of all viewers together. */
  delivering: { width: number; height: number; fps: number; kbps: number } | undefined
  isOnTarget: boolean
  limitation: ViewerStat['limitation']
}

/** A small window cannot be sent bigger than it is, and a 30 Hz screen not faster: that is the real target. */
function effectiveTarget(target: Target, source: Source) {
  const height = TARGET_HEIGHT[target.resolution]
  return {
    height: source ? Math.min(height, source.height) : height,
    fps: source ? Math.min(target.fps, source.fps) : target.fps,
  }
}

function isViewerOnTarget(stat: ViewerStat, target: Target, source: Source): boolean {
  const goal = effectiveTarget(target, source)
  return stat.height >= goal.height * ON_TARGET_RATIO && stat.fps >= goal.fps * ON_TARGET_RATIO
}

/** Worst first: lower resolution, then lower frame rate. */
function worstOf(stats: readonly ViewerStat[]): ViewerStat | undefined {
  return [...stats].sort((a, b) => a.height - b.height || a.fps - b.fps)[0]
}

function summarizeQuality(stats: readonly ViewerStat[], target: Target, source: Source): QualitySummary {
  const worst = worstOf(stats)
  if (!worst) return { delivering: undefined, isOnTarget: true, limitation: 'none' }
  const kbps = stats.reduce((sum, stat) => sum + stat.kbps, 0)
  const isOnTarget = isViewerOnTarget(worst, target, source)
  return {
    delivering: { width: worst.width, height: worst.height, fps: worst.fps, kbps },
    isOnTarget,
    limitation: isOnTarget ? 'none' : worst.limitation,
  }
}

export { ON_TARGET_RATIO, effectiveTarget, isViewerOnTarget, summarizeQuality, worstOf }
export type { QualityLimitation, QualitySummary }
