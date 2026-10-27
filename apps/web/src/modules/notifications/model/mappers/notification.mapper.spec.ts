import { SERVER_NOTIFICATION_TYPES, type Notification, type ServerNotificationType } from '@gameplay/contracts'
import { describe, expect, it } from 'vitest'

import { toHubNotification } from './notification.mapper'

const server = { id: 's1', name: 'Turbex' }
const make = (type: ServerNotificationType): Notification => ({
  id: 'n1',
  type,
  server,
  createdAt: '2026-10-25T10:00:00.000Z',
})

describe('toHubNotification', () => {
  it.each([
    ['join-approved', 'joinApproved'],
    ['join-request-sent', 'requestSent'],
    ['kicked', 'kicked'],
    ['server-deleted', 'serverDeleted'],
    ['promoted', 'promoted'],
    ['demoted', 'demoted'],
    ['invite-expired', 'inviteExpired'],
  ] as const)('maps %s to %s keeping id, server and date', (apiType, viewType) => {
    expect(toHubNotification(make(apiType))).toEqual({
      id: 'n1',
      createdAt: '2026-10-25T10:00:00.000Z',
      type: viewType,
      server,
    })
  })

  it('covers every server type the API can send', () => {
    for (const type of SERVER_NOTIFICATION_TYPES) expect(() => toHubNotification(make(type))).not.toThrow()
  })

  it("keeps the admin's text of a platform announcement", () => {
    const announcement = { title: 'Maintenance', message: 'Back in 10 minutes.' }
    expect(
      toHubNotification({
        id: 'n1',
        type: 'platform-announcement',
        announcement,
        createdAt: '2026-10-25T10:00:00.000Z',
      }),
    ).toEqual({ id: 'n1', createdAt: '2026-10-25T10:00:00.000Z', type: 'platformAnnouncement', announcement })
  })
})
