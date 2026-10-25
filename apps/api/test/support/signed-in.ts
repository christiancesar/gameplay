import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { issueRegistrationKey } from '../factories/registration-invite.factory'
import { makeSignUp } from '../factories/user.factory'

// Signs up a new user and returns the agent holding the session cookie (also
// as a Cookie header, for Socket.IO clients). Role and two-factor are set
// straight in the database.
export async function signedIn(app: INestApplication, { admin = false, twoFactor = true } = {}) {
  const { key } = await issueRegistrationKey(app)
  const body = makeSignUp({ registrationKey: key })
  const agent = request.agent(app.getHttpServer())
  const response = await agent.post('/api/auth/sign-up/email').send(body)
  if (response.status !== 200) throw new Error(`Sign-up failed with ${response.status}`)

  const user = await app.get(PrismaService).user.update({
    where: { email: body.email },
    data: admin ? { role: 'admin', twoFactorEnabled: twoFactor } : {},
  })
  const cookie = ([] as string[])
    .concat(response.headers['set-cookie'] ?? [])
    .map((line) => line.split(';')[0])
    .join('; ')
  return { agent, user, cookie }
}
