import { Injectable } from '@nestjs/common'
import type { MediaSettings, ServerMediaOverrides } from '@gameplay/contracts'
import { PrismaService } from '../../../../lib/prisma'
import { MediaSettingsRepository, type ServerMediaException } from '../media-settings.repository'

const ID = 'global'
// The schema default, for an emptied database.
const DEFAULT_SFU_BUDGET_GB = 800
const select = { sfuEnabled: true, meshEnabled: true, turnEnabled: true }

type Columns = { sfuEnabled: boolean | null; meshEnabled: boolean | null; turnEnabled: boolean | null }

function toOverrides(row: Columns): ServerMediaOverrides {
  return { sfu: row.sfuEnabled, mesh: row.meshEnabled, turn: row.turnEnabled }
}

function toColumns(values: ServerMediaOverrides): Columns {
  return { sfuEnabled: values.sfu, meshEnabled: values.mesh, turnEnabled: values.turn }
}

// Global flags live on the platform_settings row, overrides on the server.
@Injectable()
export class PrismaMediaSettingsRepository extends MediaSettingsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async getGlobal(): Promise<MediaSettings> {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: ID }, select })
    // Without the row the schema defaults apply: everything on.
    return row
      ? { sfu: row.sfuEnabled, mesh: row.meshEnabled, turn: row.turnEnabled }
      : { sfu: true, mesh: true, turn: true }
  }

  async setGlobal(settings: MediaSettings): Promise<void> {
    await this.prisma.platformSettings.createMany({ data: [{ id: ID }], skipDuplicates: true })
    const { sfu, mesh, turn } = settings
    await this.prisma.platformSettings.update({
      where: { id: ID },
      data: { sfuEnabled: sfu, meshEnabled: mesh, turnEnabled: turn },
    })
  }

  async findServer(serverId: string): Promise<ServerMediaOverrides | null> {
    const row = await this.prisma.server.findUnique({ where: { id: serverId }, select })
    return row && toOverrides(row)
  }

  async setServer(serverId: string, overrides: ServerMediaOverrides): Promise<boolean> {
    const { count } = await this.prisma.server.updateMany({ where: { id: serverId }, data: toColumns(overrides) })
    return count === 1
  }

  async listExceptions(): Promise<ServerMediaException[]> {
    const rows = await this.prisma.server.findMany({
      where: { OR: [{ sfuEnabled: { not: null } }, { meshEnabled: { not: null } }, { turnEnabled: { not: null } }] },
      select: { id: true, name: true, ...select },
      orderBy: { name: 'asc' },
    })
    return rows.map((row) => ({ serverId: row.id, serverName: row.name, overrides: toOverrides(row) }))
  }

  async getSfuBudgetGb(): Promise<number> {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: ID }, select: { sfuBudgetGb: true } })
    return row?.sfuBudgetGb ?? DEFAULT_SFU_BUDGET_GB
  }

  async setSfuBudgetGb(budgetGb: number): Promise<void> {
    await this.prisma.platformSettings.createMany({ data: [{ id: ID }], skipDuplicates: true })
    await this.prisma.platformSettings.update({ where: { id: ID }, data: { sfuBudgetGb: budgetGb } })
  }
}
