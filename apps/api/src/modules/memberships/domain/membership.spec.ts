import { type InviteRecord, serverInviteStatus } from './membership'

const now = new Date('2026-10-24T12:00:00Z')

function invite(overrides: Partial<InviteRecord> = {}): InviteRecord {
  return {
    id: 'i1',
    serverId: 's1',
    code: 'ABCDEFGH',
    createdById: 'u1',
    createdAt: new Date('2026-10-24T11:30:00Z'),
    expiresAt: new Date('2026-10-24T12:30:00Z'),
    revokedAt: null,
    usedById: null,
    usedAt: null,
    ...overrides,
  }
}

describe('serverInviteStatus', () => {
  it.each([
    ['active', invite()],
    ['expired', invite({ expiresAt: now })],
    ['used', invite({ usedAt: now, expiresAt: new Date('2026-10-24T11:00:00Z') })],
    ['revoked', invite({ revokedAt: now, usedAt: now })],
  ])('%s', (status, record) => {
    expect(serverInviteStatus(record, now)).toBe(status)
  })
})
