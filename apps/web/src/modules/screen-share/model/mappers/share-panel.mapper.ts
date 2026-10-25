import type { ShareSnapshot } from '../entities/share'
import { summarizeQuality, isViewerOnTarget } from '../rules/quality-summary'
import type { SharePanelModel, ViewerQualityRow } from '../entities/share-panel'

type ViewerProfile = { name: string; avatarUrl?: string }

/** The panel in each state. Quality is the worst viewer's; nobody watching means nothing is measured. */
function toSharePanelState(snapshot: ShareSnapshot): SharePanelModel {
  if (snapshot.status === 'idle') return { status: 'idle' }
  if (snapshot.status === 'picking') return { status: 'picking' }
  const { settings, viewerIds, stats, source } = snapshot
  const measured = viewerIds.flatMap((id) => (stats[id] ? [stats[id]] : []))
  const summary = summarizeQuality(measured, settings, source)
  return {
    status: 'live',
    source: settings.source,
    target: { resolution: settings.resolution, fps: settings.fps },
    delivering: summary.delivering,
    isOnTarget: summary.isOnTarget,
    limitation: summary.limitation,
    viewerCount: viewerIds.length,
  }
}

/** One row per viewer already measured, in the order they started watching. */
function toViewerQualities(
  snapshot: ShareSnapshot,
  profiles: Readonly<Record<string, ViewerProfile>>,
): ViewerQualityRow[] {
  const { settings, viewerIds, stats, source } = snapshot
  return viewerIds.flatMap((id) => {
    const stat = stats[id]
    if (!stat) return []
    const profile = profiles[id]
    const onTarget = isViewerOnTarget(stat, settings, source)
    return [
      {
        id,
        name: profile?.name ?? id,
        avatarUrl: profile?.avatarUrl,
        quality: { width: stat.width, height: stat.height, fps: stat.fps, kbps: stat.kbps },
        isOnTarget: onTarget,
        limitation: onTarget ? 'none' : stat.limitation,
      },
    ]
  })
}

export { toSharePanelState, toViewerQualities }
export type { ViewerProfile }
