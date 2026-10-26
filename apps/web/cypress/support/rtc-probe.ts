/** What the RTP counters of every peer connection in a page add up to. */
type RtcStats = {
  connectionStates: string[]
  audioInboundBytes: number
  audioOutboundBytes: number
  videoInboundBytes: number
  videoOutboundBytes: number
  videoFramesDecoded: number
  videoWidth: number
  videoHeight: number
}

type ProbedWindow = Window & typeof globalThis & { __rtcPcs?: RTCPeerConnection[] }

/**
 * Records every RTCPeerConnection the app creates, so a spec can read the stats.
 * Self-contained on purpose: the bot sends its source to a Playwright page, so it cannot use anything outside.
 */
function installRtcProbe(target: ProbedWindow): void {
  if (target.__rtcPcs) return
  const pcs: RTCPeerConnection[] = []
  target.__rtcPcs = pcs
  const Original = target.RTCPeerConnection
  const Probed = function (this: unknown, ...args: ConstructorParameters<typeof RTCPeerConnection>) {
    const pc = new Original(...args)
    pcs.push(pc)
    return pc
  } as unknown as typeof RTCPeerConnection
  Probed.prototype = Original.prototype
  target.RTCPeerConnection = Probed
}

/** Reads the counters. Same constraint as `installRtcProbe`: no outside references. */
async function collectRtcStats(target: ProbedWindow): Promise<RtcStats> {
  const totals = {
    connectionStates: [] as string[],
    audioInboundBytes: 0,
    audioOutboundBytes: 0,
    videoInboundBytes: 0,
    videoOutboundBytes: 0,
    videoFramesDecoded: 0,
    videoWidth: 0,
    videoHeight: 0,
  }
  for (const pc of target.__rtcPcs ?? []) {
    // Peer connections the app already tore down (leaving or switching rooms) are not part of the call anymore.
    if (pc.connectionState === 'closed') continue
    totals.connectionStates.push(pc.connectionState)
    const report = await pc.getStats()
    report.forEach((entry: Record<string, unknown>) => {
      const kind = entry.kind as string
      if (entry.type === 'inbound-rtp' && kind === 'audio') totals.audioInboundBytes += Number(entry.bytesReceived ?? 0)
      if (entry.type === 'outbound-rtp' && kind === 'audio') totals.audioOutboundBytes += Number(entry.bytesSent ?? 0)
      if (entry.type === 'outbound-rtp' && kind === 'video') totals.videoOutboundBytes += Number(entry.bytesSent ?? 0)
      if (entry.type === 'inbound-rtp' && kind === 'video') {
        totals.videoInboundBytes += Number(entry.bytesReceived ?? 0)
        totals.videoFramesDecoded += Number(entry.framesDecoded ?? 0)
        totals.videoWidth = Math.max(totals.videoWidth, Number(entry.frameWidth ?? 0))
        totals.videoHeight = Math.max(totals.videoHeight, Number(entry.frameHeight ?? 0))
      }
    })
  }
  return totals
}

export { collectRtcStats, installRtcProbe }
export type { ProbedWindow, RtcStats }
