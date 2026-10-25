import { Injectable } from '@nestjs/common'
import type { PlatformSettings } from '@gameplay/shared'
import { PrismaService } from '../../../../lib/prisma'
import { PlatformSettingsRepository } from '../platform-settings.repository'

const ID = 'global'
const select = { maxServersPerUser: true, maxMembersPerServer: true, maxRoomsPerServer: true, minChromiumVersion: true }

// The migration creates the row; upsert keeps working if it's missing (an
// emptied database), with the defaults from the Prisma schema.
@Injectable()
export class PrismaPlatformSettingsRepository extends PlatformSettingsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  get(): Promise<PlatformSettings> {
    return this.prisma.platformSettings.upsert({ where: { id: ID }, create: {}, update: {}, select })
  }

  update(data: PlatformSettings): Promise<PlatformSettings> {
    return this.prisma.platformSettings.upsert({ where: { id: ID }, create: data, update: data, select })
  }
}
