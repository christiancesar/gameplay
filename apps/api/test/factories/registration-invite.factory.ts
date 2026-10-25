import { randomUUID } from 'node:crypto'
import type { INestApplication } from '@nestjs/common'
import type { RegistrationInviteValidity } from '@gameplay/contracts'
import { PrismaService } from '../../src/lib/prisma'
import { GenerateRegistrationInviteUseCase } from '../../src/modules/registration-invites/use-cases/generate-registration-invite.use-case'

// Generates a real registration key, created by a fresh admin row (straight
// in the database, since signing up needs a key in the first place).
export async function issueRegistrationKey(app: INestApplication, validity: RegistrationInviteValidity = '7d') {
  const prisma = app.get(PrismaService)
  const id = randomUUID()
  await prisma.user.create({
    data: { id, name: 'admin', email: `admin-${id}@example.com`, username: `admin_${id.slice(0, 8)}`, role: 'admin' },
  })
  return app.get(GenerateRegistrationInviteUseCase).execute({ validity, createdById: id })
}
