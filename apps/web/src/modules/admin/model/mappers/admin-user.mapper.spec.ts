import { describe, expect, it } from 'vitest'

import { toAdminSessionItem, toAdminUserItem } from './admin-user.mapper'
import { adminSession, adminUser } from '../../view-models/test/admin-seed'

const context = { sessionCount: 2, serversOwned: 1, defaultServerLimit: 1 }

describe('toAdminUserItem', () => {
  it('maps the API user to the View item with the default limit', () => {
    expect(toAdminUserItem(adminUser, context)).toEqual({
      id: 'u1',
      name: 'Kisnaider',
      email: 'kis@gameplay.local',
      avatarUrl: undefined,
      isOnline: true,
      isSuspended: false,
      isPlatformAdmin: false,
      sessionCount: 2,
      serverLimit: { value: 1, isOverride: false },
      serversOwned: 1,
    })
  })

  it('falls back to the username when there is no display name', () => {
    expect(toAdminUserItem({ ...adminUser, displayUsername: null }, context).name).toBe('kisnaider')
  })

  it('shows a known override as the limit', () => {
    expect(toAdminUserItem(adminUser, { ...context, serverLimitOverride: 0 }).serverLimit).toEqual({
      value: 0,
      isOverride: true,
    })
  })

  it('flags the platform admin and the suspension', () => {
    const item = toAdminUserItem({ ...adminUser, role: 'admin', suspended: true, image: 'x.png' }, context)
    expect(item).toMatchObject({ isPlatformAdmin: true, isSuspended: true, avatarUrl: 'x.png' })
  })
})

describe('toAdminSessionItem', () => {
  it('summarizes the user agent and keeps the IP', () => {
    expect(toAdminSessionItem(adminSession)).toEqual({
      id: 's1',
      ip: '187.64.12.201',
      device: 'Chrome 141 · Windows',
      lastActiveAt: adminSession.createdAt,
      isActiveNow: false,
    })
  })

  it('uses a dash when the IP was not recorded', () => {
    expect(toAdminSessionItem({ ...adminSession, ipAddress: null }).ip).toBe('–')
  })
})
