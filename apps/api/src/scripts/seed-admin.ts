import { NestFactory } from '@nestjs/core'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { passwordSchema, usernameSchema } from '@gameplay/shared'
import { z } from 'zod'
import { AppModule } from '../app.module'
import type { Auth } from '../lib/auth'
import { PrismaService } from '../lib/prisma'

// Creates the platform admin, or promotes the account if the email exists.
// The admin sets up two-factor on the first sign-in; admin routes refuse
// the account until then.
//   dev:  npm run seed:admin
//   prod: node apps/api/dist/scripts/seed-admin
const adminSchema = z.object({
  ADMIN_EMAIL: z.email(),
  ADMIN_USERNAME: usernameSchema,
  ADMIN_PASSWORD: passwordSchema,
})

async function main() {
  const admin = adminSchema.parse(process.env)
  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: ['error', 'warn'] })
  await app.init()

  try {
    const prisma = app.get(PrismaService)
    const existing = await prisma.user.findUnique({ where: { email: admin.ADMIN_EMAIL } })

    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } })
      console.log(`${admin.ADMIN_EMAIL} already exists; role set to admin.`)
      return
    }

    await app.get<AuthService<Auth>>(AuthService).api.createUser({
      body: {
        email: admin.ADMIN_EMAIL,
        password: admin.ADMIN_PASSWORD,
        name: admin.ADMIN_USERNAME,
        role: 'admin',
        data: { username: admin.ADMIN_USERNAME.toLowerCase(), displayUsername: admin.ADMIN_USERNAME },
      },
    })
    console.log(`Platform admin ${admin.ADMIN_EMAIL} created.`)
  } finally {
    await app.close()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
