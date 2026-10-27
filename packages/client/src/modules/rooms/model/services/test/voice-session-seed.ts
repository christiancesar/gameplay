import type { IceConfigResponse, Participant } from '@gameplay/contracts'

const selfId = 'u1'

const participant = (userId: string, overrides: Partial<Participant> = {}): Participant => ({
  userId,
  muted: false,
  deafened: false,
  streaming: null,
  streamMode: null,
  ...overrides,
})

const alone: Participant[] = [participant('u1')]
const withAna: Participant[] = [participant('u1'), participant('u2')]
const withAnaAndBruna: Participant[] = [participant('u1'), participant('u2'), participant('u3')]

const iceWithTurn: IceConfigResponse = {
  iceServers: [{ urls: ['turn:turn.test'], username: 'user', credential: 'secret' }],
  ttlSeconds: 3600,
  requestIp: '203.0.113.7',
}

const iceRenewed: IceConfigResponse = {
  iceServers: [{ urls: ['turn:turn.test'], username: 'user2', credential: 'secret2' }],
  ttlSeconds: 3600,
  requestIp: '203.0.113.7',
}

const stunOnly: IceConfigResponse = {
  iceServers: [{ urls: ['stun:stun.test'] }],
  ttlSeconds: 0,
  requestIp: null,
}

export { alone, iceRenewed, iceWithTurn, participant, selfId, stunOnly, withAna, withAnaAndBruna }
