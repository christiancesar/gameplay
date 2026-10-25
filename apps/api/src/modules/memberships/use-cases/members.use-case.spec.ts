import { ServerPermissionDeniedError } from '../../servers/errors/servers.errors'
import { CannotTargetSelfError, MemberNotFoundError, OwnerCannotLeaveError } from '../errors/memberships.errors'
import { makeMembershipsContext } from '../test/fakes'

describe('Members', () => {
  it('lists the owner first', async () => {
    const { listMembers, serverId } = await makeMembershipsContext()

    const members = await listMembers.execute({ serverId, userId: 'member' })

    expect(members.map((m) => [m.user.id, m.role])).toEqual([
      ['owner', 'owner'],
      ['admin', 'admin'],
      ['member', 'member'],
    ])
  })

  it.each(['owner', 'admin'])('lets the %s kick a member', async (actor) => {
    const { kick, servers, events, serverId } = await makeMembershipsContext()

    await kick.execute({ serverId, userId: actor, targetId: 'member' })

    expect(await servers.findRole(serverId, 'member')).toBeNull()
    expect(events.published).toEqual([
      { name: 'membership.removed', payload: { serverId, userId: 'member', reason: 'kick' } },
    ])
  })

  it('lets an admin kick another admin', async () => {
    const { kick, promote, servers, serverId } = await makeMembershipsContext()
    await promote.execute({ serverId, userId: 'owner', targetId: 'member' })

    await kick.execute({ serverId, userId: 'admin', targetId: 'member' })

    expect(await servers.findRole(serverId, 'member')).toBeNull()
  })

  it('never kicks or demotes the owner', async () => {
    const { kick, demote, serverId } = await makeMembershipsContext()

    await expect(kick.execute({ serverId, userId: 'admin', targetId: 'owner' })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
    await expect(demote.execute({ serverId, userId: 'admin', targetId: 'owner' })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
  })

  it('refuses a member moderating', async () => {
    const { kick, promote, serverId } = await makeMembershipsContext()

    await expect(kick.execute({ serverId, userId: 'member', targetId: 'admin' })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
    await expect(promote.execute({ serverId, userId: 'member', targetId: 'member' })).rejects.toThrow(
      CannotTargetSelfError,
    )
  })

  it('promotes and demotes, announcing the new role', async () => {
    const { promote, demote, servers, events, serverId } = await makeMembershipsContext()

    await promote.execute({ serverId, userId: 'admin', targetId: 'member' })
    expect(await servers.findRole(serverId, 'member')).toMatchObject({ role: 'admin' })
    await demote.execute({ serverId, userId: 'owner', targetId: 'member' })

    expect(await servers.findRole(serverId, 'member')).toMatchObject({ role: 'member' })
    expect(events.published.map((e) => e.payload)).toEqual([
      { serverId, userId: 'member', role: 'admin' },
      { serverId, userId: 'member', role: 'member' },
    ])
  })

  it('does not promote an admin or demote a member', async () => {
    const { promote, demote, serverId } = await makeMembershipsContext()

    await expect(promote.execute({ serverId, userId: 'owner', targetId: 'admin' })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
    await expect(demote.execute({ serverId, userId: 'owner', targetId: 'member' })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
  })

  it('answers 404 for someone outside the server', async () => {
    const { kick, serverId } = await makeMembershipsContext()

    await expect(kick.execute({ serverId, userId: 'owner', targetId: 'stranger' })).rejects.toThrow(MemberNotFoundError)
  })

  it('lets admin and member leave, but not the owner', async () => {
    const { leave, servers, events, serverId } = await makeMembershipsContext()

    await leave.execute({ serverId, userId: 'member' })
    await leave.execute({ serverId, userId: 'admin' })

    expect(await servers.countMembers(serverId)).toBe(1)
    expect(events.published.map((e) => e.payload)).toContainEqual({ serverId, userId: 'admin', reason: 'leave' })
    await expect(leave.execute({ serverId, userId: 'owner' })).rejects.toThrow(OwnerCannotLeaveError)
  })
})
