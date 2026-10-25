import { type RegistrationInviteRecord, registrationInviteStatus } from './registration-invite'

const now = new Date('2026-10-24T12:00:00Z')

function invite(overrides: Partial<RegistrationInviteRecord> = {}): RegistrationInviteRecord {
  return {
    id: 'i1',
    keySuffix: '234',
    createdAt: new Date('2026-10-24T00:00:00Z'),
    expiresAt: new Date('2026-10-25T00:00:00Z'),
    revokedAt: null,
    usedAt: null,
    createdById: 'admin',
    usedBy: null,
    ...overrides,
  }
}

describe('registrationInviteStatus', () => {
  it.each([
    ['active', invite()],
    ['expired', invite({ expiresAt: now })],
    ['revoked', invite({ revokedAt: now })],
    ['used', invite({ usedAt: now })],
    ['used', invite({ usedAt: now, expiresAt: now })],
  ])('is %s', (status, record) => {
    expect(registrationInviteStatus(record, now)).toBe(status)
  })
})
