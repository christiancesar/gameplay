import { ServerNotFoundError } from '../../servers/errors/servers.errors'
import { makeNotificationsContext } from '../test/notifications-context'

const announcement = { title: 'Maintenance', message: 'Back in 10 minutes.' }

describe('SendAnnouncementUseCase', () => {
  it('reaches everyone and announces each notice with its text', async () => {
    const { sendAnnouncement, notifications, events } = makeNotificationsContext()

    const result = await sendAnnouncement.execute({ ...announcement, audience: { type: 'everyone' }, sentById: 'ana' })

    expect(result).toEqual({ recipients: 3 })
    expect(notifications.notifications).toMatchObject(
      ['ana', 'bia', 'caio'].map((userId) => ({ userId, type: 'platform-announcement', ...announcement })),
    )
    expect(events.published[0]).toEqual({
      name: 'notification.created',
      payload: { userId: 'ana', notificationId: notifications.notifications[0].id, announcement },
    })
  })

  it("reaches a server's members", async () => {
    const { sendAnnouncement, servers, notifications } = makeNotificationsContext()
    servers.addMember('s1', 'ana', 'owner')
    servers.addMember('s1', 'bia', 'member')

    await sendAnnouncement.execute({ ...announcement, audience: { type: 'server', serverId: 's1' }, sentById: 'ana' })

    expect(notifications.notifications.map((n) => n.userId)).toEqual(['ana', 'bia'])
    await expect(
      sendAnnouncement.execute({ ...announcement, audience: { type: 'server', serverId: 'gone' }, sentById: 'ana' }),
    ).rejects.toBeInstanceOf(ServerNotFoundError)
  })

  it('reaches only accounts that exist, once each', async () => {
    const { sendAnnouncement, notifications } = makeNotificationsContext()

    const result = await sendAnnouncement.execute({
      ...announcement,
      audience: { type: 'users', userIds: ['bia', 'ghost', 'bia'] },
      sentById: 'ana',
    })

    expect(result).toEqual({ recipients: 1 })
    expect(notifications.notifications.map((n) => n.userId)).toEqual(['bia'])
  })
})
