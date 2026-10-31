import type { INestApplication } from '@nestjs/common'
import { PrismaService } from '../../src/lib/prisma'
import { resetDatabase } from '../support/database'
import { createTestApp } from '../support/create-test-app'
import { signedIn } from '../support/signed-in'

describe('Public product content (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    app = await createTestApp()
    await app.listen(0)
    prisma = app.get(PrismaService)
  })

  beforeEach(async () => resetDatabase(prisma))

  afterAll(async () => app.close())

  it('reads only published roadmap and changelog content without a session', async () => {
    const admin = await signedIn(app, { admin: true })
    const roadmap = await admin.agent.post('/api/admin/public/roadmap').send({
      slug: 'public-roadmap',
      title: 'Public roadmap',
      description: 'A visible roadmap item.',
      status: 'now',
      position: 0,
      visibility: 'published',
    })
    expect(roadmap.status).toBe(201)

    const draft = await admin.agent.post('/api/admin/public/roadmap').send({
      slug: 'private-roadmap',
      title: 'Private roadmap',
      description: 'A draft roadmap item.',
      status: 'next',
      position: 1,
      visibility: 'draft',
    })
    expect(draft.status).toBe(201)

    const changelog = await admin.agent.post('/api/admin/public/changelog').send({
      slug: 'first-release',
      version: '0.1.0',
      title: 'First release',
      summary: 'The first public release.',
      body: 'The Gameplay public portal is available.',
      tags: ['release'],
      visibility: 'published',
    })
    expect(changelog.status).toBe(201)

    const roadmapResponse = await fetch(`${await app.getUrl()}/api/public/roadmap`)
    expect(roadmapResponse.status).toBe(200)
    expect((await roadmapResponse.json()).items).toHaveLength(1)

    const changelogResponse = await fetch(`${await app.getUrl()}/api/public/changelog`)
    expect(changelogResponse.status).toBe(200)
    expect((await changelogResponse.json()).entries).toHaveLength(1)
  })

  it('allows one authenticated vote and a feature request, but rejects duplicate votes', async () => {
    const admin = await signedIn(app, { admin: true })
    const item = await admin.agent.post('/api/admin/public/roadmap').send({
      slug: 'voting',
      title: 'Voting',
      description: 'A roadmap item that accepts votes.',
      status: 'next',
      position: 0,
      visibility: 'published',
    })
    const user = await signedIn(app)

    const firstVote = await user.agent.post(`/api/public/roadmap/${item.body.id}/vote`)
    expect(firstVote.status).toBe(200)
    expect(firstVote.body).toEqual({ itemId: item.body.id, voted: true, voteCount: 1 })

    const duplicateVote = await user.agent.post(`/api/public/roadmap/${item.body.id}/vote`)
    expect(duplicateVote.status).toBe(409)
    expect(duplicateVote.body.error.code).toBe('FEATURE_VOTE_ALREADY_EXISTS')

    const request = await user.agent.post('/api/public/feature-requests').send({
      title: 'A better feature',
      description: 'Please consider this feature.',
    })
    expect(request.status).toBe(201)
    expect(request.body.status).toBe('pending')

    const mine = await user.agent.get('/api/public/feature-requests/mine')
    expect(mine.body.requests).toHaveLength(1)
  })

  it('protects editorial routes with admin and two-factor authorization', async () => {
    const user = await signedIn(app)
    const response = await user.agent.get('/api/admin/public/roadmap')
    expect(response.status).toBe(403)

    const admin = await signedIn(app, { admin: true, twoFactor: false })
    const twoFactorResponse = await admin.agent.get('/api/admin/public/roadmap')
    expect(twoFactorResponse.status).toBe(403)
    expect(twoFactorResponse.body.error.code).toBe('TWO_FACTOR_REQUIRED')
  })
})
