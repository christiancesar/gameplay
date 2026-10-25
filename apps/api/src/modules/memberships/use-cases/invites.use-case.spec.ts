import { ServerPermissionDeniedError } from '../../servers/errors/servers.errors'
import { MemberLimitReachedError, ServerInviteNotFoundError, ServerInviteUsedError } from '../errors/memberships.errors'
import { makeMembershipsContext } from '../test/memberships-context'

describe('Server invites', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a single-use invite valid for 1 hour', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-24T12:00:00Z') })
    const { createInvite, serverId } = await makeMembershipsContext()

    const invite = await createInvite.execute({ serverId, userId: 'admin' })

    expect(invite.code).toHaveLength(8)
    expect(invite.expiresAt).toEqual(new Date('2026-10-24T13:00:00Z'))
    expect(invite.createdBy.id).toBe('admin')
  })

  it('refuses a member', async () => {
    const { createInvite, serverId } = await makeMembershipsContext()

    await expect(createInvite.execute({ serverId, userId: 'member' })).rejects.toThrow(ServerPermissionDeniedError)
  })

  it('is blocked at the member limit', async () => {
    const { createInvite, serverId, serverLimits } = await makeMembershipsContext()
    serverLimits.servers.set(serverId, { maxMembers: 3, maxRooms: null })

    await expect(createInvite.execute({ serverId, userId: 'owner' })).rejects.toThrow(MemberLimitReachedError)
  })

  it('revokes, and revoking again is fine', async () => {
    const { createInvite, revokeInvite, memberships, serverId } = await makeMembershipsContext()
    const invite = await createInvite.execute({ serverId, userId: 'owner' })

    await revokeInvite.execute({ serverId, userId: 'admin', inviteId: invite.id })
    const revokedAt = memberships.invites[0].revokedAt
    await revokeInvite.execute({ serverId, userId: 'admin', inviteId: invite.id })

    expect(revokedAt).toBeInstanceOf(Date)
    expect(memberships.invites[0].revokedAt).toBe(revokedAt)
  })

  it('does not revoke a used invite or one of another server', async () => {
    const { createInvite, revokeInvite, join, serverId } = await makeMembershipsContext()
    const invite = await createInvite.execute({ serverId, userId: 'owner' })
    await join.execute({ code: invite.code, userId: 'newcomer' })

    await expect(revokeInvite.execute({ serverId, userId: 'owner', inviteId: invite.id })).rejects.toThrow(
      ServerInviteUsedError,
    )
    await expect(revokeInvite.execute({ serverId, userId: 'owner', inviteId: 'nope' })).rejects.toThrow(
      ServerInviteNotFoundError,
    )
  })

  it('resolves the code for the landing', async () => {
    const { createInvite, resolve, serverId } = await makeMembershipsContext()
    const invite = await createInvite.execute({ serverId, userId: 'owner' })

    await expect(resolve.execute({ code: invite.code, userId: null })).resolves.toEqual({
      status: 'active',
      server: { id: serverId, name: 'Squad', iconUrl: null, memberCount: 3, full: false },
      alreadyMember: false,
    })
    await expect(resolve.execute({ code: invite.code, userId: 'member' })).resolves.toMatchObject({
      alreadyMember: true,
    })
    await expect(resolve.execute({ code: 'ZZZZZZZZ', userId: null })).resolves.toEqual({
      status: 'not-found',
      server: null,
      alreadyMember: false,
    })
  })
})
