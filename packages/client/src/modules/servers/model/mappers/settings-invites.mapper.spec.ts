import { describe, expect, it } from 'vitest'

import {
  activeInvite,
  revokedInvite,
  settingsInvites,
  usedInvite,
} from '@/modules/servers/view-models/test/server-settings-seed'

import { toInviteItems } from './settings-invites.mapper'

const now = Date.parse('2026-03-01T10:30:00.000Z')

describe('toInviteItems', () => {
  it('orders newest first and builds the link', () => {
    const items = toInviteItems(settingsInvites, 'https://gameplay.test', now)
    expect(items.map((item) => item.code)).toEqual(['JH34SD32', 'AB23CD45', 'ZX98CV76'])
    expect(items[0]?.link).toBe('https://gameplay.test/i/JH34SD32')
    expect(items[0]?.createdBy).toEqual({ name: 'turbex' })
  })

  it('maps each status', () => {
    const items = toInviteItems([activeInvite, usedInvite, revokedInvite], 'https://x', now)
    expect(items.map((item) => item.status)).toEqual([
      { type: 'active' },
      { type: 'used', user: { name: 'ana' }, usedAt: '2026-03-01T09:10:00.000Z' },
      { type: 'revoked' },
    ])
  })

  it('shows an active invite past its expiry as expired', () => {
    const [item] = toInviteItems([activeInvite], 'https://x', Date.parse('2099-03-01T11:00:01.000Z'))
    expect(item?.status).toEqual({ type: 'expired' })
  })

  it('keeps an expired status from the API', () => {
    const [item] = toInviteItems([{ ...activeInvite, status: 'expired' }], 'https://x', now)
    expect(item?.status).toEqual({ type: 'expired' })
  })
})
