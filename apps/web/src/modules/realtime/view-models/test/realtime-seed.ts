import type { Participant, PresenceSnapshot } from '@gameplay/contracts'

const participantAna: Participant = { userId: 'u1', muted: false, deafened: false, streaming: null }

const snapshotS1: PresenceSnapshot = {
  serverId: 's1',
  onlineUserIds: ['u1', 'u2'],
  rooms: [{ roomId: 'r1', participants: [participantAna] }],
}

const snapshotS2: PresenceSnapshot = { serverId: 's2', onlineUserIds: ['u4'], rooms: [] }

export { participantAna, snapshotS1, snapshotS2 }
