import type { StatsRecord } from '@/shared/media/media-transport'

/** `getStats()` of a connection that goes through the TURN relay, carrying voice both ways. */
const RELAYED_VOICE: StatsRecord[] = [
  { id: 'T1', type: 'transport', selectedCandidatePairId: 'CP1' },
  {
    id: 'CP1',
    type: 'candidate-pair',
    localCandidateId: 'L1',
    remoteCandidateId: 'R1',
    currentRoundTripTime: 0.042,
    state: 'succeeded',
  },
  { id: 'L1', type: 'local-candidate', candidateType: 'relay' },
  { id: 'R1', type: 'remote-candidate', candidateType: 'srflx' },
  { id: 'IA', type: 'inbound-rtp', kind: 'audio', packetsReceived: 990, packetsLost: 10, jitter: 0.012 },
]

/** The same connection a moment later: 495 more packets, 5 more lost. */
const RELAYED_VOICE_LATER: StatsRecord[] = RELAYED_VOICE.map((record) =>
  record.id === 'IA' ? { ...record, packetsReceived: 1485, packetsLost: 15, jitter: 0.02 } : record,
)

/** Direct (Firefox: no transport entry), watching the peer's screen and sharing ours. */
const DIRECT_WITH_SCREENS: StatsRecord[] = [
  {
    id: 'CP2',
    type: 'candidate-pair',
    localCandidateId: 'L2',
    remoteCandidateId: 'R2',
    nominated: true,
    state: 'succeeded',
  },
  { id: 'L2', type: 'local-candidate', candidateType: 'host' },
  { id: 'R2', type: 'remote-candidate', candidateType: 'host' },
  {
    id: 'IV',
    type: 'inbound-rtp',
    kind: 'video',
    packetsReceived: 5000,
    packetsLost: 0,
    jitter: 0.004,
    framesPerSecond: 59.6,
    frameHeight: 1080,
  },
  {
    id: 'OV',
    type: 'outbound-rtp',
    kind: 'video',
    framesPerSecond: 29.8,
    frameHeight: 720,
    qualityLimitationReason: 'bandwidth',
  },
]

/** Still connecting: candidates, no working pair yet. */
const CONNECTING: StatsRecord[] = [
  { id: 'CP3', type: 'candidate-pair', localCandidateId: 'L3', remoteCandidateId: 'R3', state: 'in-progress' },
  { id: 'L3', type: 'local-candidate', candidateType: 'host' },
]

export { CONNECTING, DIRECT_WITH_SCREENS, RELAYED_VOICE, RELAYED_VOICE_LATER }
