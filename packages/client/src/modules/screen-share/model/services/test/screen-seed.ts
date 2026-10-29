import { vi } from 'vitest'

import type { CallMedia } from '@/shared/media/call-media'
import type { StatsRecord } from '@/shared/media/media-transport'
import { fakeStream, fakeTrack } from '@/shared/media/test/media-fakes'

import { FakeAudioEngine } from '@/modules/rooms/model/services/test/fake-audio-engine'
import { FakeMediaTransport } from '@/modules/rooms/model/services/test/fake-media-transport'

import type { ShareSettings } from '../../entities/share'

const selfId = 'u1'

const gameSettings: ShareSettings = {
  source: 'window',
  resolution: '1080p',
  aspectRatio: '16:9',
  fps: 60,
  includeAudio: true,
  audioApps: [],
}
const tabSettings: ShareSettings = {
  source: 'tab',
  resolution: '720p',
  aspectRatio: '16:9',
  fps: 30,
  includeAudio: false,
  audioApps: [],
}

/** `outbound-rtp` video entry as Chrome reports it. */
const outbound = (overrides: Record<string, unknown> = {}): StatsRecord => ({
  type: 'outbound-rtp',
  kind: 'video',
  frameWidth: 1920,
  frameHeight: 1080,
  framesPerSecond: 60,
  bytesSent: 0,
  timestamp: 1000,
  qualityLimitationReason: 'none',
  ...overrides,
})

/** `inbound-rtp` video entry of a screen being watched, as Chrome reports it. */
const inbound = (overrides: Record<string, unknown> = {}): StatsRecord => ({
  type: 'inbound-rtp',
  kind: 'video',
  frameWidth: 1920,
  frameHeight: 1080,
  framesPerSecond: 60,
  bytesReceived: 0,
  timestamp: 1000,
  ...overrides,
})

function makeCallMedia(roomId = 'r1'): CallMedia & { transport: FakeMediaTransport; audio: FakeAudioEngine } {
  return { serverId: 's1', roomId, selfId, transport: new FakeMediaTransport(), audio: new FakeAudioEngine() }
}

/** What `getDisplayMedia` would give: a video track, and a game audio track when asked. */
function makeCapture(withAudio: boolean) {
  const video = Object.assign(fakeTrack('video', 'screen-video'), {
    contentHint: '',
    onended: null as (() => void) | null,
    applyConstraints: vi.fn(async (_constraints: MediaTrackConstraints) => undefined),
    getSettings: () => ({ width: 1920, height: 1080, frameRate: 60 }),
  })
  const audio = withAudio ? fakeTrack('audio', 'screen-audio') : null
  const tracks = audio ? [video, audio] : [video]
  const stream = fakeStream(tracks)
  return { stream, video, audio }
}

export { gameSettings, inbound, makeCallMedia, makeCapture, outbound, selfId, tabSettings }
