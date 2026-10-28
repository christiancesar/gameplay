import type { StatsRecord } from '@/shared/media/media-transport'

import type { ReceivedQuality } from '../entities/watch'

/** The numbers of one `inbound-rtp` video entry that matter to the viewer. */
type InboundSample = {
  width: number
  height: number
  fps: number
  bytesReceived: number
  /** Milliseconds, from the stats entry. */
  timestamp: number
}

function numberOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const isInboundVideo = (record: StatsRecord) =>
  record.type === 'inbound-rtp' && (record.kind === 'video' || record.mediaType === 'video')

/**
 * The entry of the screen being watched. A connection keeps the entries of screens watched before, so the
 * track id picks the right one; without it (older Firefox) the one that received the most wins.
 */
function pickInbound(records: readonly StatsRecord[], trackId: string): StatsRecord | undefined {
  const videos = records.filter(isInboundVideo)
  const byTrack = videos.find((record) => record.trackIdentifier === trackId)
  if (byTrack) return byTrack
  if (videos.some((record) => typeof record.trackIdentifier === 'string')) return undefined
  return [...videos].sort((a, b) => (numberOf(b.bytesReceived) ?? 0) - (numberOf(a.bytesReceived) ?? 0))[0]
}

/** Null until the decoder has produced frames (no size yet). */
function toInboundSample(records: readonly StatsRecord[], trackId: string): InboundSample | null {
  const inbound = pickInbound(records, trackId)
  if (!inbound) return null
  const width = numberOf(inbound.frameWidth)
  const height = numberOf(inbound.frameHeight)
  const bytesReceived = numberOf(inbound.bytesReceived)
  const timestamp = numberOf(inbound.timestamp)
  if (!width || !height || bytesReceived === undefined || timestamp === undefined) return null
  return { width, height, fps: numberOf(inbound.framesPerSecond) ?? 0, bytesReceived, timestamp }
}

/** The rate needs two samples: bytes received in between, over the time in between. Null on the first. */
function toReceivedQuality(current: InboundSample, previous: InboundSample | undefined): ReceivedQuality | null {
  if (!previous || current.timestamp <= previous.timestamp) return null
  const seconds = (current.timestamp - previous.timestamp) / 1000
  const kbps = Math.max(0, ((current.bytesReceived - previous.bytesReceived) * 8) / 1000 / seconds)
  return { width: current.width, height: current.height, fps: current.fps, kbps }
}

export { toInboundSample, toReceivedQuality }
export type { InboundSample }
