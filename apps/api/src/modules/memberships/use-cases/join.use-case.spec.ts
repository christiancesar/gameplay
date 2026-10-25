import { ServerPermissionDeniedError } from '../../servers/errors/servers.errors'
import {
  JoinRequestDecidedError,
  JoinRequestPendingError,
  MemberLimitReachedError,
  ServerInviteExpiredError,
  ServerInviteNotFoundError,
  ServerInviteRevokedError,
  ServerInviteUsedError,
} from '../errors/memberships.errors'
import { makeMembershipsContext } from '../test/fakes'

describe('Joining a server', () => {
  async function withInvite() {
    const ctx = await makeMembershipsContext()
    const invite = await ctx.createInvite.execute({ serverId: ctx.serverId, userId: 'owner' })
    return { ...ctx, invite }
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a pending request and consumes the invite', async () => {
    const { join, invite, memberships, events, serverId } = await withInvite()

    await expect(join.execute({ code: invite.code, userId: 'ana' })).resolves.toEqual({ serverId, result: 'pending' })

    expect(memberships.invites[0]).toMatchObject({ usedById: 'ana', usedAt: expect.any(Date) })
    expect(events.published).toEqual([
      { name: 'membership.join-requested', payload: { serverId, userId: 'ana', requestId: expect.any(String) } },
    ])
  })

  it('joins right away with auto-approve and a free slot', async () => {
    const { join, invite, servers, events, serverId } = await withInvite()
    await servers.update(serverId, { autoApprove: true })

    await expect(join.execute({ code: invite.code, userId: 'ana' })).resolves.toMatchObject({ result: 'joined' })

    expect(await servers.findRole(serverId, 'ana')).toMatchObject({ role: 'member' })
    expect(events.published).toEqual([
      { name: 'membership.approved', payload: { serverId, userId: 'ana', approvedById: null } },
    ])
  })

  it('waits with auto-approve when the server is full', async () => {
    const { join, invite, servers, serverLimits, serverId } = await withInvite()
    await servers.update(serverId, { autoApprove: true })
    serverLimits.servers.set(serverId, { maxMembers: 3, maxRooms: null })

    await expect(join.execute({ code: invite.code, userId: 'ana' })).resolves.toMatchObject({ result: 'pending' })
    expect(await servers.findRole(serverId, 'ana')).toBeNull()
  })

  it('tells a member they already belong, without using the invite', async () => {
    const { join, invite, memberships } = await withInvite()

    await expect(join.execute({ code: invite.code, userId: 'member' })).resolves.toMatchObject({
      result: 'already-member',
    })
    expect(memberships.invites[0].usedAt).toBeNull()
  })

  it('refuses a second request while one is pending', async () => {
    const { join, invite, createInvite, memberships, serverId } = await withInvite()
    await join.execute({ code: invite.code, userId: 'ana' })
    const second = await createInvite.execute({ serverId, userId: 'owner' })

    await expect(join.execute({ code: second.code, userId: 'ana' })).rejects.toThrow(JoinRequestPendingError)
    expect(memberships.invites[0].usedAt).not.toBeNull()
    expect(memberships.invites[1].usedAt).toBeNull()
  })

  it('refuses an expired, revoked, used or unknown invite', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-24T12:00:00Z') })
    const { join, invite, createInvite, revokeInvite, serverId } = await withInvite()
    const revoked = await createInvite.execute({ serverId, userId: 'owner' })
    await revokeInvite.execute({ serverId, userId: 'owner', inviteId: revoked.id })
    const used = await createInvite.execute({ serverId, userId: 'owner' })
    await join.execute({ code: used.code, userId: 'bia' })

    await expect(join.execute({ code: revoked.code, userId: 'ana' })).rejects.toThrow(ServerInviteRevokedError)
    await expect(join.execute({ code: used.code, userId: 'ana' })).rejects.toThrow(ServerInviteUsedError)
    await expect(join.execute({ code: 'ZZZZZZZZ', userId: 'ana' })).rejects.toThrow(ServerInviteNotFoundError)
    vi.setSystemTime(new Date('2026-10-24T13:00:00Z'))
    await expect(join.execute({ code: invite.code, userId: 'ana' })).rejects.toThrow(ServerInviteExpiredError)
  })

  it('approves into a member, and not twice', async () => {
    const { join, approve, invite, memberships, servers, events, serverId } = await withInvite()
    await join.execute({ code: invite.code, userId: 'ana' })
    const requestId = memberships.requests[0].id
    events.published.length = 0

    await approve.execute({ serverId, userId: 'admin', requestId })

    expect(await servers.findRole(serverId, 'ana')).toMatchObject({ role: 'member' })
    expect(memberships.memberInvites.get(`${serverId}:ana`)).toBe(invite.id)
    expect(events.published).toEqual([
      { name: 'membership.approved', payload: { serverId, userId: 'ana', approvedById: 'admin' } },
    ])
    await expect(approve.execute({ serverId, userId: 'admin', requestId })).rejects.toThrow(JoinRequestDecidedError)
  })

  it('blocks the approval at the member limit and keeps the request', async () => {
    const { join, approve, invite, memberships, serverLimits, serverId } = await withInvite()
    await join.execute({ code: invite.code, userId: 'ana' })
    serverLimits.servers.set(serverId, { maxMembers: 3, maxRooms: null })

    await expect(approve.execute({ serverId, userId: 'owner', requestId: memberships.requests[0].id })).rejects.toThrow(
      MemberLimitReachedError,
    )
    expect(memberships.requests[0].status).toBe('pending')
  })

  it('declines, keeping the invite used', async () => {
    const { join, decline, invite, memberships, events, serverId } = await withInvite()
    await join.execute({ code: invite.code, userId: 'ana' })
    events.published.length = 0

    await decline.execute({ serverId, userId: 'owner', requestId: memberships.requests[0].id })

    expect(memberships.requests[0].status).toBe('declined')
    expect(memberships.invites[0].usedAt).not.toBeNull()
    expect(events.published[0]).toMatchObject({ name: 'membership.declined' })
  })

  it('refuses a member deciding requests', async () => {
    const { join, approve, invite, memberships, serverId } = await withInvite()
    await join.execute({ code: invite.code, userId: 'ana' })

    await expect(
      approve.execute({ serverId, userId: 'member', requestId: memberships.requests[0].id }),
    ).rejects.toThrow(ServerPermissionDeniedError)
  })
})
