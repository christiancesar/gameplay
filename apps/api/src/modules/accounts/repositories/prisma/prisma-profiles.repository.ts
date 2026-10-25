import { Injectable } from '@nestjs/common'
import { localeSchema, themeSchema } from '@gameplay/contracts'
import type { Prisma } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import type { Preferences, ProfileRecord } from '../../domain/account'
import { type Avatar, ProfilesRepository } from '../profiles.repository'

const select = {
  id: true,
  email: true,
  username: true,
  name: true,
  displayUsername: true,
  image: true,
  avatarKey: true,
  theme: true,
  locale: true,
} satisfies Prisma.UserSelect

type Row = Prisma.UserGetPayload<{ select: typeof select }>

// theme and locale are plain text columns; an unknown value falls back to the
// defaults instead of breaking the profile.
function toRecord({ name, username, theme, locale, ...row }: Row): ProfileRecord {
  return {
    ...row,
    username: username ?? name,
    theme: themeSchema.catch('dark').parse(theme),
    locale: localeSchema.nullable().catch(null).parse(locale),
  }
}

@Injectable()
export class PrismaProfilesRepository extends ProfilesRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async find(userId: string): Promise<ProfileRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { id: userId }, select })
    return row && toRecord(row)
  }

  async updatePreferences(userId: string, preferences: Preferences): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: preferences })
  }

  async setAvatar(userId: string, avatar: Avatar | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { image: avatar?.image ?? null, avatarKey: avatar?.key ?? null },
    })
  }
}
