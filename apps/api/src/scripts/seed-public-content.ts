import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { NestFactory } from '@nestjs/core'
import { adminEnvObject } from '@gameplay/env'

import { AppModule } from '../app.module'
import { PrismaService } from '../lib/prisma'

type FeatureSeed = {
  slug: string
  title: string
  description: string
  status: 'now' | 'next' | 'exploring' | 'done'
  position: number
  visibility: 'draft' | 'published' | 'archived'
}

type FeatureSeedFile = {
  categories: { features: FeatureSeed[] }[]
}

const CONTENT_FILE = resolve(process.cwd(), 'plans/features/features.json')

async function main() {
  const admin = adminEnvObject.parse(process.env)
  const content = JSON.parse(await readFile(CONTENT_FILE, 'utf8')) as FeatureSeedFile
  const features = content.categories.flatMap((category) => category.features)
  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: ['error', 'warn'] })
  await app.init()

  try {
    const prisma = app.get(PrismaService)
    const user = await prisma.user.findUnique({ where: { email: admin.ADMIN_EMAIL }, select: { id: true } })
    if (!user) throw new Error(`Admin account not found: ${admin.ADMIN_EMAIL}`)

    for (const feature of features) {
      await prisma.roadmapItem.upsert({
        where: { slug: feature.slug },
        create: {
          slug: feature.slug,
          title: feature.title,
          description: feature.description,
          status: feature.status.toUpperCase() as 'NOW' | 'NEXT' | 'EXPLORING' | 'DONE',
          position: feature.position,
          visibility: feature.visibility.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
          createdById: user.id,
          updatedById: user.id,
        },
        update: {
          title: feature.title,
          description: feature.description,
          status: feature.status.toUpperCase() as 'NOW' | 'NEXT' | 'EXPLORING' | 'DONE',
          position: feature.position,
          visibility: feature.visibility.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
          updatedById: user.id,
        },
      })
    }

    console.log(`Seeded ${features.length} public roadmap features.`)
  } finally {
    await app.close()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
