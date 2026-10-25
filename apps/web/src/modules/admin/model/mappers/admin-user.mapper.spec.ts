import { describe, expect, it } from 'vitest'

import { toAdminSessionItem, toAdminUserItem } from './admin-user.mapper'
import { adminSession, adminUser } from '../../view-models/test/admin-seed'

describe('toAdminUserItem', () => {
  it('maps the API user to the View item with the effective limit', () => {
    expect(toAdminUserItem(adminUser)).toEqual({
      id: 'u1',
      name: 'Kisnaider',
      email: 'kis@gameplay.local',
      avatarUrl: undefined,
      isOnline: true,
      isSuspended: false,
      isPlatformAdmin: false,
      sessionCount: 1,
      serverLimit: { value: 1, isOverride: false },
      serversOwned: 1,
    })
  })

  it('falls back to the username when there is no display name', () => {
    expect(toAdminUserItem({ ...adminUser, displayUsername: null }).name).toBe('kisnaider')
  })

  it('marks the limit as override, even when it is 0', () => {
    const user = { ...adminUser, maxServersOverride: 0, effectiveMaxServers: 0 }
    expect(toAdminUserItem(user).serverLimit).toEqual({
      value: 0,
      isOverride: true,
    })
  })

  it('flags the platform admin and the suspension', () => {
    const item = toAdminUserItem({ ...adminUser, role: 'admin', suspended: true, image: 'x.png' })
    expect(item).toMatchObject({ isPlatformAdmin: true, isSuspended: true, avatarUrl: 'x.png' })
  })
})

describe('toAdminSessionItem', () => {
  it('summarizes the user agent and keeps the IP', () => {
    expect(toAdminSessionItem(adminSession)).toEqual({
      id: 's1',
      ip: '187.64.12.201',
      device: 'Chrome 141 · Windows',
      lastActiveAt: adminSession.lastActiveAt,
      isActiveNow: false,
    })
  })

  it('uses a dash when the IP was not recorded', () => {
    expect(toAdminSessionItem({ ...adminSession, ipAddress: null }).ip).toBe('–')
  })
})
