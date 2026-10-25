import { Injectable, Module } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { OnDomainEvent } from '../../src/common/events/domain-event-bus'
import type { DomainEventName, DomainEvents } from '../../src/common/events/domain-events'
import { PrismaService } from '../../src/lib/prisma'
import { issueRegistrationKey } from '../factories/registration-invite.factory'
import { makeSignUp } from '../factories/user.factory'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'

const MEMBERSHIP_EVENTS = [
  'membership.join-requested',
  'membership.approved',
  'membership.declined',
  'membership.removed',
  'membership.role-changed',
  'server-invite.expired-on-sign-up',
] as const satisfies DomainEventName[]

@Injectable()
class FakeListener {
  readonly received: { name: DomainEventName; payload: unknown }[] = []

  @OnDomainEvent('membership.join-requested')
  joinRequested(payload: DomainEvents['membership.join-requested']) {
    this.received.push({ name: 'membership.join-requested', payload })
  }

  @OnDomainEvent('membership.approved')
  approved(payload: DomainEvents['membership.approved']) {
    this.received.push({ name: 'membership.approved', payload })
  }

  @OnDomainEvent('membership.removed')
  removed(payload: DomainEvents['membership.removed']) {
    this.received.push({ name: 'membership.removed', payload })
  }

  @OnDomainEvent('membership.role-changed')
  roleChanged(payload: DomainEvents['membership.role-changed']) {
    this.received.push({ name: 'membership.role-changed', payload })
  }

  @OnDomainEvent('server-invite.expired-on-sign-up')
  expired(payload: DomainEvents['server-invite.expired-on-sign-up']) {
    this.received.push({ name: 'server-invite.expired-on-sign-up', payload })
  }

  names() {
    return this.received.map((event) => event.name).filter((name) => MEMBERSHIP_EVENTS.includes(name as never))
  }
}

@Module({ providers: [FakeListener] })
class FakeListenerModule {}

describe('Invites and members (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let listener: FakeListener

  beforeAll(async () => {
    app = await createTestApp({ imports: [FakeListenerModule] })
    prisma = app.get(PrismaService)
    listener = app.get(FakeListener)
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
    listener.received.length = 0
  })

  afterAll(async () => {
    await app.close()
  })

  async function ownServer() {
    const owner = await signedIn(app)
    const server = await owner.agent.post('/api/servers').send({ name: 'Turbex' })
    return { owner, serverId: server.body.id as string }
  }

  async function invite(agent: ReturnType<typeof request.agent>, serverId: string) {
    const response = await agent.post(`/api/servers/${serverId}/invites`)
    expect(response.status).toBe(201)
    return response.body as { id: string; code: string }
  }

  it('runs the whole flow: invite, request, approve, promote, kick', async () => {
    const { owner, serverId } = await ownServer()
    const ana = await signedIn(app)
    const { code } = await invite(owner.agent, serverId)

    const landing = await request(app.getHttpServer()).get(`/api/invites/${code.toLowerCase()}`)
    expect(landing.body).toEqual({
      status: 'active',
      server: { id: serverId, name: 'Turbex', iconUrl: null, memberCount: 1, full: false },
      alreadyMember: false,
    })

    const joined = await ana.agent.post(`/api/invites/${code}/join`)
    expect(joined.body).toEqual({ serverId, result: 'pending' })
    expect((await ana.agent.get(`/api/servers/${serverId}`)).status).toBe(404)

    const requests = await owner.agent.get(`/api/servers/${serverId}/join-requests`)
    expect(requests.body.requests).toEqual([
      expect.objectContaining({ user: expect.objectContaining({ id: ana.user.id }), invitedBy: expect.any(Object) }),
    ])
    const requestId = requests.body.requests[0].id
    expect((await owner.agent.post(`/api/servers/${serverId}/join-requests/${requestId}/approve`)).status).toBe(204)

    const members = await ana.agent.get(`/api/servers/${serverId}/members`)
    expect(members.body.members.map((m: { role: string }) => m.role)).toEqual(['owner', 'member'])
    expect(members.body.members[1].invite.createdBy.id).toBe(owner.user.id)

    expect((await owner.agent.post(`/api/servers/${serverId}/members/${ana.user.id}/promote`)).status).toBe(204)
    const anaRole = await ana.agent.get(`/api/servers/${serverId}`)
    expect(anaRole.body.role).toBe('admin')

    const kickOwner = await ana.agent.post(`/api/servers/${serverId}/members/${owner.user.id}/kick`)
    expect(kickOwner.status).toBe(403)

    expect((await owner.agent.post(`/api/servers/${serverId}/members/${ana.user.id}/kick`)).status).toBe(204)
    expect((await ana.agent.get(`/api/servers/${serverId}`)).status).toBe(404)

    const invites = await owner.agent.get(`/api/servers/${serverId}/invites`)
    expect(invites.body.invites[0]).toMatchObject({ status: 'used', usedBy: { id: ana.user.id } })
    expect(listener.names()).toEqual([
      'membership.join-requested',
      'membership.approved',
      'membership.role-changed',
      'membership.removed',
    ])
  })

  it('joins right away with auto-approve', async () => {
    const { owner, serverId } = await ownServer()
    await owner.agent.put(`/api/servers/${serverId}/auto-approve`).send({ autoApprove: true })
    const ana = await signedIn(app)
    const { code } = await invite(owner.agent, serverId)

    expect((await ana.agent.post(`/api/invites/${code}/join`)).body.result).toBe('joined')
    expect((await ana.agent.get('/api/servers')).body.servers).toHaveLength(1)
  })

  it('blocks invites and approvals at the member limit', async () => {
    const { owner, serverId } = await ownServer()
    const ana = await signedIn(app)
    const { code } = await invite(owner.agent, serverId)
    await ana.agent.post(`/api/invites/${code}/join`)
    await prisma.server.update({ where: { id: serverId }, data: { maxMembersOverride: 1 } })

    const blocked = await owner.agent.post(`/api/servers/${serverId}/invites`)
    expect(blocked.status).toBe(409)
    expect(blocked.body.error.code).toBe('MEMBER_LIMIT_REACHED')
    const requestId = (await owner.agent.get(`/api/servers/${serverId}/join-requests`)).body.requests[0].id
    const approval = await owner.agent.post(`/api/servers/${serverId}/join-requests/${requestId}/approve`)
    expect(approval.status).toBe(409)
  })

  it('refuses a used or revoked invite and a member managing invites', async () => {
    const { owner, serverId } = await ownServer()
    const used = await invite(owner.agent, serverId)
    const revoked = await invite(owner.agent, serverId)
    await owner.agent.post(`/api/servers/${serverId}/invites/${revoked.id}/revoke`)
    const ana = await signedIn(app)
    const bia = await signedIn(app)
    await ana.agent.post(`/api/invites/${used.code}/join`)

    expect((await bia.agent.post(`/api/invites/${used.code}/join`)).body.error.code).toBe('SERVER_INVITE_USED')
    expect((await bia.agent.post(`/api/invites/${revoked.code}/join`)).body.error.code).toBe('SERVER_INVITE_REVOKED')
    expect((await bia.agent.post('/api/invites/bad/join')).status).toBe(404)

    await owner.agent.put(`/api/servers/${serverId}/auto-approve`).send({ autoApprove: true })
    const third = await invite(owner.agent, serverId)
    await bia.agent.post(`/api/invites/${third.code}/join`)
    expect((await bia.agent.post(`/api/servers/${serverId}/invites`)).status).toBe(403)
  })

  it('keeps the owner from leaving and lets a member leave', async () => {
    const { owner, serverId } = await ownServer()
    await owner.agent.put(`/api/servers/${serverId}/auto-approve`).send({ autoApprove: true })
    const ana = await signedIn(app)
    await ana.agent.post(`/api/invites/${(await invite(owner.agent, serverId)).code}/join`)

    const ownerLeaves = await owner.agent.post(`/api/servers/${serverId}/leave`)
    expect(ownerLeaves.status).toBe(403)
    expect(ownerLeaves.body.error.code).toBe('OWNER_CANNOT_LEAVE')
    expect((await ana.agent.post(`/api/servers/${serverId}/leave`)).status).toBe(204)
  })

  describe('sign-up from an invite link', () => {
    async function signUpWith(serverInviteCode: string) {
      const { key } = await issueRegistrationKey(app)
      const body = { ...makeSignUp({ registrationKey: key }), serverInviteCode }
      const agent = request.agent(app.getHttpServer())
      const response = await agent.post('/api/auth/sign-up/email').send(body)
      expect(response.status).toBe(200)
      return { agent, userId: response.body.user.id as string }
    }

    it('creates the join request with a valid invite', async () => {
      const { owner, serverId } = await ownServer()
      const { code } = await invite(owner.agent, serverId)

      const { userId } = await signUpWith(code)

      const requests = await owner.agent.get(`/api/servers/${serverId}/join-requests`)
      expect(requests.body.requests.map((r: { user: { id: string } }) => r.user.id)).toEqual([userId])
    })

    it('creates the account and tells the Hub when the invite expired', async () => {
      const { owner, serverId } = await ownServer()
      const { id, code } = await invite(owner.agent, serverId)
      await prisma.serverInvite.update({ where: { id }, data: { expiresAt: new Date(Date.now() - 1000) } })

      const { agent, userId } = await signUpWith(code)

      expect((await agent.get('/api/me/profile')).status).toBe(200)
      expect(await prisma.joinRequest.count()).toBe(0)
      expect(listener.received).toContainEqual({
        name: 'server-invite.expired-on-sign-up',
        payload: { userId, serverId, serverName: 'Turbex' },
      })
    })
  })

  it('documents the routes', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/openapi.json')

    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        '/api/servers/{serverId}/invites',
        '/api/invites/{code}',
        '/api/invites/{code}/join',
        '/api/servers/{serverId}/join-requests/{requestId}/approve',
        '/api/servers/{serverId}/members/{targetId}/kick',
        '/api/servers/{serverId}/leave',
      ]),
    )
  })
})
