import type { SfuTrackKind } from '@gameplay/contracts'

// A track the person sends to the SFU (their screen).
export type PublishedTrack = {
  mid: string
  kind: SfuTrackKind
  trackName: string
}

// A track the person receives from the SFU: someone else's screen.
export type PulledTrack = PublishedTrack & {
  streamerId: string
  streamerSessionId: string
}

// One browser connection to the Cloudflare Realtime SFU, bound to the voice
// room the person was in when it was created.
export type SfuSession = {
  sessionId: string
  userId: string
  serverId: string
  roomId: string
  published: PublishedTrack[]
  pulled: PulledTrack[]
}
