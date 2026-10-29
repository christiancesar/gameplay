import type { StatsRecord } from '@/shared/media/media-transport'

function logScreenShareDebug(event: string, details: Record<string, unknown>): void {
  if (import.meta.env.VITE_APP_ENV !== 'development') return
  console.warn(`[gameplay-screen-debug] ${JSON.stringify({ at: new Date().toISOString(), event, ...details })}`)
}

function videoEncodingStats(records: readonly StatsRecord[]) {
  return records
    .filter(
      (record) => record.type === 'outbound-rtp' && (record.kind === 'video' || record.mediaType === 'video'),
    )
    .map((record) => ({
      rid: record.rid,
      width: record.frameWidth,
      height: record.frameHeight,
      fps: record.framesPerSecond,
      limitation: record.qualityLimitationReason,
      bytesSent: record.bytesSent,
      active: record.active,
    }))
}

export { logScreenShareDebug, videoEncodingStats }
