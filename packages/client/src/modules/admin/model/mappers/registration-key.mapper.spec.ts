import { describe, expect, it } from 'vitest'

import { toRegistrationKeyItem } from './registration-key.mapper'
import { usedInvite, activeInvite } from '../../view-models/test/admin-seed'

describe('toRegistrationKeyItem', () => {
  it('maps an active key', () => {
    expect(toRegistrationKeyItem(activeInvite)).toEqual({
      id: 'k1',
      hint: 'X4P',
      createdAt: activeInvite.createdAt,
      expiresAt: activeInvite.expiresAt,
      status: { type: 'active' },
    })
  })

  it('shows who used a used key', () => {
    expect(toRegistrationKeyItem(usedInvite).status).toEqual({ type: 'used', userName: 'lua' })
  })

  it.each(['revoked', 'expired'] as const)('keeps the %s status', (status) => {
    expect(toRegistrationKeyItem({ ...activeInvite, status }).status).toEqual({ type: status })
  })
})
