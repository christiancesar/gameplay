import { NotificationNotFoundError } from '../errors/notifications.errors'
import { makeNotificationsContext } from '../test/notifications-context'

describe('notification use-cases', () => {
  it('stores one notification per recipient with the server name and announces each', async () => {
    const { notify, notifications, events } = makeNotificationsContext()

    await notify.execute({ userIds: ['bia', 'caio'], type: 'promoted', serverId: 's1' })

    expect(notifications.notifications).toMatchObject([
      { userId: 'bia', type: 'promoted', serverId: 's1', serverName: 'Turbex', dismissedAt: null },
      { userId: 'caio', type: 'promoted', serverId: 's1', serverName: 'Turbex', dismissedAt: null },
    ])
    expect(events.published).toEqual(
      notifications.notifications.map(({ id, userId }) => ({
        name: 'notification.created',
        payload: { userId, notificationId: id },
      })),
    )
  })

  it('keeps the name the event brought, and skips a server that is gone', async () => {
    const { notify, notifications } = makeNotificationsContext()

    await notify.execute({ userIds: ['bia'], type: 'server-deleted', serverId: 'gone', serverName: 'Old' })
    await notify.execute({ userIds: ['bia'], type: 'kicked', serverId: 'gone' })

    expect(notifications.notifications).toMatchObject([{ type: 'server-deleted', serverName: 'Old' }])
  })

  it('stores what the listener gets from the events', async () => {
    const { listener, list } = makeNotificationsContext()

    await listener.removed({ serverId: 's1', userId: 'bia', reason: 'kick' })
    await listener.removed({ serverId: 's1', userId: 'bia', reason: 'leave' })
    await listener.approved({ serverId: 's1', userId: 'bia', approvedById: null })

    expect((await list.execute('bia')).map(({ type }) => type)).toEqual(['kicked'])
  })

  it('lists newest first and hides the dismissed ones', async () => {
    const { notify, list, dismiss, dismissAll } = makeNotificationsContext()
    await notify.execute({ userIds: ['bia'], type: 'join-request-sent', serverId: 's1' })
    await notify.execute({ userIds: ['bia'], type: 'join-approved', serverId: 's1' })
    await notify.execute({ userIds: ['bia'], type: 'promoted', serverId: 's1' })

    const [promoted] = await list.execute('bia')
    await dismiss.execute({ userId: 'bia', notificationId: promoted.id })
    await dismiss.execute({ userId: 'bia', notificationId: promoted.id })
    expect((await list.execute('bia')).map(({ type }) => type)).toEqual(['join-approved', 'join-request-sent'])

    await dismissAll.execute('bia')
    expect(await list.execute('bia')).toEqual([])
  })

  it("refuses to dismiss someone else's notification", async () => {
    const { notify, list, dismiss } = makeNotificationsContext()
    await notify.execute({ userIds: ['bia'], type: 'kicked', serverId: 's1' })
    const [notification] = await list.execute('bia')

    await expect(dismiss.execute({ userId: 'caio', notificationId: notification.id })).rejects.toBeInstanceOf(
      NotificationNotFoundError,
    )
    await expect(dismiss.execute({ userId: 'bia', notificationId: 'nope' })).rejects.toBeInstanceOf(
      NotificationNotFoundError,
    )
  })
})
