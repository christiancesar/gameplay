import type { INestApplication } from '@nestjs/common'
import { PrismaService } from '../../src/lib/prisma'
import { createServerWithMembers } from '../factories/server.factory'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'
import { connectSocket, nextEvent, type TestSocket } from '../support/socket-client'

type Agent = Awaited<ReturnType<typeof signedIn>>['agent']

describe('Hub notifications (e2e)', () => {
  let app: INestApplication
  const sockets: TestSocket[] = []

  beforeAll(async () => {
    app = await createTestApp()
    await app.listen(0)
  })

  beforeEach(async () => {
    await resetDatabase(app.get(PrismaService))
  })

  afterEach(() => {
    for (const socket of sockets.splice(0)) socket.close()
  })

  afterAll(async () => {
    await app.close()
  })

  async function notificationsOf(agent: Agent) {
    const response = await agent.get('/api/me/notifications')
    expect(response.status).toBe(200)
    return response.body.notifications as { id: string; type: string; server: { id: string; name: string } }[]
  }

  it('notifies a kicked member in real time, and the notice can be dismissed', async () => {
    const { owner, members, serverId } = await createServerWithMembers(app)
    const [ana] = members
    const socket = await connectSocket(app, ana.cookie)
    sockets.push(socket)
    const serverName = (await owner.agent.get(`/api/servers/${serverId}`)).body.name as string

    const arrived = nextEvent(socket, 'notification:new')
    expect((await owner.agent.post(`/api/servers/${serverId}/members/${ana.user.id}/kick`)).status).toBe(204)
    const { id } = await arrived

    expect(await notificationsOf(ana.agent)).toEqual([
      { id, type: 'kicked', server: { id: serverId, name: serverName }, createdAt: expect.any(String) },
    ])
    expect(await notificationsOf(owner.agent)).toEqual([])

    expect((await owner.agent.post(`/api/me/notifications/${id}/dismiss`)).status).toBe(404)
    expect((await ana.agent.post(`/api/me/notifications/${id}/dismiss`)).status).toBe(204)
    expect(await notificationsOf(ana.agent)).toEqual([])
  })

  it('notifies a pending request, its approval and a promotion', async () => {
    const { owner, serverId } = await createServerWithMembers(app, { members: 0 })
    await owner.agent.put(`/api/servers/${serverId}/auto-approve`).send({ autoApprove: false })
    const bia = await signedIn(app)
    const { code } = (await owner.agent.post(`/api/servers/${serverId}/invites`)).body
    await bia.agent.post(`/api/invites/${code}/join`)
    const [request] = (await owner.agent.get(`/api/servers/${serverId}/join-requests`)).body.requests
    await owner.agent.post(`/api/servers/${serverId}/join-requests/${request.id}/approve`)
    await owner.agent.post(`/api/servers/${serverId}/members/${bia.user.id}/promote`)

    expect((await notificationsOf(bia.agent)).map(({ type }) => type)).toEqual([
      'promoted',
      'join-approved',
      'join-request-sent',
    ])
    expect((await bia.agent.post('/api/me/notifications/dismiss-all')).status).toBe(204)
    expect(await notificationsOf(bia.agent)).toEqual([])
  })

  it('notifies the members of a deleted server, not who deleted it', async () => {
    const { owner, members, serverId } = await createServerWithMembers(app)
    const name = (await owner.agent.get(`/api/servers/${serverId}`)).body.name as string

    expect((await owner.agent.delete(`/api/servers/${serverId}`)).status).toBe(204)

    expect(await notificationsOf(members[0].agent)).toEqual([
      expect.objectContaining({ type: 'server-deleted', server: { id: serverId, name } }),
    ])
    expect(await notificationsOf(owner.agent)).toEqual([])
  })
})
