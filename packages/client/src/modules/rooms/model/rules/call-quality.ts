import type { StatsRecord } from '@/shared/media/media-transport'

/** Packet counters of what arrives from the peer. Counters grow for the whole life of the connection. */
type InboundCounters = { packetsReceived: number; packetsLost: number; jitterMs: number }

/** One reading of the connection with a peer, from `getStats()`. */
type ConnectionSample = {
  /** Through the TURN relay rather than straight between the two browsers. */
  relay: boolean
  rttMs: number | null
  /** The peer's voice (and screen audio, when shared). */
  audioIn: InboundCounters | null
  /** The peer's screen, while watching it. */
  videoIn: (InboundCounters & { fps: number; height: number }) | null
  /** This tab's screen, while sharing it with the peer. */
  videoOut: { fps: number; height: number; limited: boolean } | null
}

/** What goes to Grafana: numbers in `values`, the label in `context`. */
type CallQuality = { values: Record<string, number>; context: { connection: 'relay' | 'direct' } }

function numberOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function byId(records: readonly StatsRecord[], id: unknown): StatsRecord | undefined {
  return typeof id === 'string' ? records.find((record) => record.id === id) : undefined
}

function selectedPair(records: readonly StatsRecord[]): StatsRecord | undefined {
  const transport = records.find((record) => record.type === 'transport')
  return (
    byId(records, transport?.selectedCandidatePairId) ??
    // Firefox has no transport entry: the nominated pair that works is the one in use.
    records.find(
      (record) => record.type === 'candidate-pair' && record.nominated === true && record.state === 'succeeded',
    )
  )
}

function inbound(records: readonly StatsRecord[], kind: 'audio' | 'video'): StatsRecord[] {
  return records.filter(
    (record) => record.type === 'inbound-rtp' && (record.kind === kind || record.mediaType === kind),
  )
}

function countersOf(entries: StatsRecord[]): InboundCounters | null {
  if (entries.length === 0) return null
  return {
    packetsReceived: entries.reduce((sum, entry) => sum + (numberOf(entry.packetsReceived) ?? 0), 0),
    packetsLost: entries.reduce((sum, entry) => sum + Math.max(0, numberOf(entry.packetsLost) ?? 0), 0),
    jitterMs: Math.max(...entries.map((entry) => (numberOf(entry.jitter) ?? 0) * 1000)),
  }
}

/** Null while the connection has no working candidate pair yet (still connecting, or failed). */
function toConnectionSample(records: readonly StatsRecord[]): ConnectionSample | null {
  const pair = selectedPair(records)
  if (!pair) return null
  const local = byId(records, pair.localCandidateId)
  const remote = byId(records, pair.remoteCandidateId)
  const rtt = numberOf(pair.currentRoundTripTime)

  const videoIn = inbound(records, 'video').sort(
    (a, b) => (numberOf(b.packetsReceived) ?? 0) - (numberOf(a.packetsReceived) ?? 0),
  )[0]
  const videoInCounters = videoIn ? countersOf([videoIn]) : null
  const videoOut = records.find(
    (record) => record.type === 'outbound-rtp' && (record.kind === 'video' || record.mediaType === 'video'),
  )

  return {
    relay: local?.candidateType === 'relay' || remote?.candidateType === 'relay',
    rttMs: rtt === undefined ? null : rtt * 1000,
    audioIn: countersOf(inbound(records, 'audio')),
    videoIn:
      videoIn && videoInCounters
        ? {
            ...videoInCounters,
            fps: numberOf(videoIn.framesPerSecond) ?? 0,
            height: numberOf(videoIn.frameHeight) ?? 0,
          }
        : null,
    videoOut: videoOut
      ? {
          fps: numberOf(videoOut.framesPerSecond) ?? 0,
          height: numberOf(videoOut.frameHeight) ?? 0,
          limited: typeof videoOut.qualityLimitationReason === 'string' && videoOut.qualityLimitationReason !== 'none',
        }
      : null,
  }
}

/** Lost over sent since the previous reading; since the start of the connection on the first one. */
function lossRatio(current: InboundCounters, previous: InboundCounters | null | undefined): number {
  const lost = current.packetsLost - (previous?.packetsLost ?? 0)
  const received = current.packetsReceived - (previous?.packetsReceived ?? 0)
  const total = lost + received
  return total > 0 && lost > 0 ? lost / total : 0
}

/** Rounded values of one reading. Each part shows up only while that media flows. */
function toCallQuality(current: ConnectionSample, previous?: ConnectionSample): CallQuality {
  const values: Record<string, number> = {}
  if (current.rttMs !== null) values.rtt_ms = Math.round(current.rttMs)
  if (current.audioIn) {
    values.audio_jitter_ms = Math.round(current.audioIn.jitterMs)
    values.audio_loss_ratio = Number(lossRatio(current.audioIn, previous?.audioIn).toFixed(4))
  }
  if (current.videoIn) {
    values.screen_in_fps = Math.round(current.videoIn.fps)
    values.screen_in_height = current.videoIn.height
    values.screen_in_jitter_ms = Math.round(current.videoIn.jitterMs)
    values.screen_in_loss_ratio = Number(lossRatio(current.videoIn, previous?.videoIn).toFixed(4))
  }
  if (current.videoOut) {
    values.screen_out_fps = Math.round(current.videoOut.fps)
    values.screen_out_height = current.videoOut.height
    values.screen_out_limited = current.videoOut.limited ? 1 : 0
  }
  return { values, context: { connection: current.relay ? 'relay' : 'direct' } }
}

export { toCallQuality, toConnectionSample }
export type { CallQuality, ConnectionSample }
