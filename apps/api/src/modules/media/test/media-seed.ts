import type { SessionDescription, SfuTrack } from '@gameplay/contracts'

export const BROWSER_OFFER: SessionDescription & { type: 'offer' } = { type: 'offer', sdp: 'browser-offer' }
export const BROWSER_ANSWER: SessionDescription & { type: 'answer' } = { type: 'answer', sdp: 'browser-answer' }

// A screen with sound, as the streamer's browser offers it.
export const SCREEN_TRACKS: SfuTrack[] = [
  { mid: '0', kind: 'video' },
  { mid: '1', kind: 'audio' },
]

// Accounts of the realtime seed, for the notices.
export const SEED_USER_IDS = ['ana', 'bia', 'caio']
