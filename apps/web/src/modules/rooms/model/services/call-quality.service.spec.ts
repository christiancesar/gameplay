import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CallMedia } from '@/shared/media/call-media'

import type { CallQuality } from '../rules/call-quality'
import { CallQualityReporter } from './call-quality.service'
import { FakeMediaTransport } from './test/fake-media-transport'
import { CONNECTING, RELAYED_VOICE, RELAYED_VOICE_LATER } from './test/webrtc-stats-seed'

function setup() {
  let handler: ((media: CallMedia | null) => void) | undefined
  const reports: CallQuality[] = []
  const transport = new FakeMediaTransport()
  const media = { serverId: 's1', roomId: 'r1', selfId: 'me', transport } as unknown as CallMedia
  const reporter = new CallQualityReporter({
    subscribeMedia: (next) => {
      handler = next
      return () => {
        handler = undefined
      }
    },
    report: (quality) => reports.push(quality),
    intervalMs: 1000,
  })
  return { reporter, transport, media, reports, emit: (next: CallMedia | null) => handler?.(next) }
}

describe('CallQualityReporter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads each connection on every tick of a call, skipping the ones still connecting', async () => {
    const { reporter, transport, media, reports, emit } = setup()
    transport.addPeer('ana')
    transport.addPeer('bia')
    transport.connectionStats = { ana: RELAYED_VOICE, bia: CONNECTING }
    reporter.start()
    emit(media)

    await vi.advanceTimersByTimeAsync(1000)

    expect(reports).toEqual([
      { values: { rtt_ms: 42, audio_jitter_ms: 12, audio_loss_ratio: 0.01 }, context: { connection: 'relay' } },
    ])
  })

  it('measures loss between readings of the same connection', async () => {
    const { reporter, transport, media, reports, emit } = setup()
    transport.addPeer('ana')
    transport.connectionStats = { ana: RELAYED_VOICE }
    reporter.start()
    emit(media)
    await vi.advanceTimersByTimeAsync(1000)

    transport.connectionStats = { ana: RELAYED_VOICE_LATER }
    await vi.advanceTimersByTimeAsync(1000)

    expect(reports).toHaveLength(2)
    expect(reports[1].values.audio_jitter_ms).toBe(20)
  })

  it('stops reading when the call ends', async () => {
    const { reporter, transport, media, reports, emit } = setup()
    transport.addPeer('ana')
    transport.connectionStats = { ana: RELAYED_VOICE }
    reporter.start()
    emit(media)
    emit(null)

    await vi.advanceTimersByTimeAsync(5000)

    expect(reports).toEqual([])
    expect(transport.getConnectionStats).not.toHaveBeenCalled()
  })
})
