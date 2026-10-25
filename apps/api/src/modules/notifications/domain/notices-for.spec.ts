import { noticesFor } from './notices-for'

describe('noticesFor', () => {
  it('tells the requester the request is waiting', () => {
    expect(noticesFor['membership.join-requested']({ serverId: 's1', userId: 'bia', requestId: 'q1' })).toEqual({
      userIds: ['bia'],
      type: 'join-request-sent',
      serverId: 's1',
    })
  })

  it('tells about an approval only when someone approved', () => {
    expect(noticesFor['membership.approved']({ serverId: 's1', userId: 'bia', approvedById: 'ana' })).toEqual({
      userIds: ['bia'],
      type: 'join-approved',
      serverId: 's1',
    })
    expect(noticesFor['membership.approved']({ serverId: 's1', userId: 'bia', approvedById: null })).toBeNull()
  })

  it('tells a kicked member, not one who left', () => {
    expect(noticesFor['membership.removed']({ serverId: 's1', userId: 'bia', reason: 'kick' })).toMatchObject({
      userIds: ['bia'],
      type: 'kicked',
    })
    expect(noticesFor['membership.removed']({ serverId: 's1', userId: 'bia', reason: 'leave' })).toBeNull()
  })

  it('tells about a promotion and a demotion', () => {
    const changed = (role: 'admin' | 'member') =>
      noticesFor['membership.role-changed']({ serverId: 's1', userId: 'bia', role })?.type

    expect(changed('admin')).toBe('promoted')
    expect(changed('member')).toBe('demoted')
  })

  it('tells every member but who deleted the server, with its name', () => {
    const event = { serverId: 's1', serverName: 'Turbex', memberIds: ['ana', 'bia'] }

    expect(noticesFor['server.deleted']({ ...event, deletedById: 'ana' })).toEqual({
      userIds: ['bia'],
      type: 'server-deleted',
      serverId: 's1',
      serverName: 'Turbex',
    })
    expect(noticesFor['server.deleted']({ ...event, deletedById: null })?.userIds).toEqual(['ana', 'bia'])
  })

  it('tells a new user the invite of the link expired', () => {
    expect(
      noticesFor['server-invite.expired-on-sign-up']({ userId: 'caio', serverId: 's1', serverName: 'Turbex' }),
    ).toEqual({ userIds: ['caio'], type: 'invite-expired', serverId: 's1', serverName: 'Turbex' })
  })
})
