import type { StatsRecord } from '@/shared/media/media-transport'

import type { ViewerStat } from '../entities/share'

/** The numbers of one `outbound-rtp` video entry that matter to the monitor. */
type OutboundSample = {
  width: number
  height: number
  fps: number
  bytesSent: number
  /** Milliseconds, from the stats entry. */
  timestamp: number
  limitation: ViewerStat['limitation']
}

function numberOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function limitationOf(reason: unknown): ViewerStat['limitation'] {
  if (reason === 'bandwidth' || reason === 'cpu') return reason
  return reason === 'other' ? 'other' : 'none'
}

/** Null until the encoder has produced frames (no size yet). */
function toOutboundSample(records: readonly StatsRecord[]): OutboundSample | null {
  const outbound = records.find(
    (record) => record.type === 'outbound-rtp' && (record.kind === 'video' || record.mediaType === 'video'),
  )
  if (!outbound) return null
  const width = numberOf(outbound.frameWidth)
  const height = numberOf(outbound.frameHeight)
  const bytesSent = numberOf(outbound.bytesSent)
  const timestamp = numberOf(outbound.timestamp)
  if (!width || !height || bytesSent === undefined || timestamp === undefined) return null
  return {
    width,
    height,
    fps: numberOf(outbound.framesPerSecond) ?? 0,
    bytesSent,
    timestamp,
    limitation: limitationOf(outbound.qualityLimitationReason),
  }
}

/** The rate needs two samples: bytes sent in between, over the time in between. Null on the first. */
function toViewerStat(current: OutboundSample, previous: OutboundSample | undefined): ViewerStat | null {
  if (!previous || current.timestamp <= previous.timestamp) return null
  const seconds = (current.timestamp - previous.timestamp) / 1000
  const kbps = Math.max(0, ((current.bytesSent - previous.bytesSent) * 8) / 1000 / seconds)
  return { width: current.width, height: current.height, fps: current.fps, kbps, limitation: current.limitation }
}

/**
 * What goes up to the SFU: the largest simulcast layer gives the size and fps; the bytes of every layer
 * add up, since all of them leave the streamer's network.
 */
function toUplinkSample(records: readonly StatsRecord[]): OutboundSample | null {
  const layers = records.filter(
    (record) => record.type === 'outbound-rtp' && (record.kind === 'video' || record.mediaType === 'video'),
  )
  const largest = [...layers].sort((a, b) => (numberOf(b.frameHeight) ?? 0) - (numberOf(a.frameHeight) ?? 0))[0]
  if (!largest) return null
  const bytesSent = layers.reduce((sum, layer) => sum + (numberOf(layer.bytesSent) ?? 0), 0)
  return toOutboundSample([{ ...largest, bytesSent }])
}

export { toUplinkSample, toOutboundSample, toViewerStat }
export type { OutboundSample }
