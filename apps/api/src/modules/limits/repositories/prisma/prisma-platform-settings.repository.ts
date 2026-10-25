import { Injectable } from '@nestjs/common'
import type { PlatformSettings } from '@gameplay/shared'
import { PrismaService } from '../../../../lib/prisma'
import { PlatformSettingsRepository } from '../platform-settings.repository'

const ID = 'global'
const select = { maxServersPerUser: true, maxMembersPerServer: true, maxRoomsPerServer: true, minChromiumVersion: true }

// The migration creates the row. If it's missing (an emptied database), it is
// recreated with the schema defaults through ON CONFLICT DO NOTHING: two
// requests doing it at once don't collide, which a plain upsert does.
@Injectable()
export class PrismaPlatformSettingsRepository extends PlatformSettingsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async get(): Promise<PlatformSettings> {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: ID }, select })
    if (settings) return settings
    await this.ensureRow()
    return this.prisma.platformSettings.findUniqueOrThrow({ where: { id: ID }, select })
  }

  async update(data: PlatformSettings): Promise<PlatformSettings> {
    await this.ensureRow()
    return this.prisma.platformSettings.update({ where: { id: ID }, data, select })
  }

  private async ensureRow() {
    await this.prisma.platformSettings.createMany({ data: [{ id: ID }], skipDuplicates: true })
  }
}
