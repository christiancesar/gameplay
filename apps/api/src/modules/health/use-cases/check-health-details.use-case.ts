import { Injectable } from '@nestjs/common'
import { probe } from '../../../common/health/probe'
import { PrismaService } from '../../../lib/prisma'
import { IceHealthService } from '../../ice/services/ice-health.service'
import { StorageProvider } from '../../storage/providers/storage/storage.provider'
import { overallStatus } from '../domain/overall-status'
import type { HealthDetails } from '../dtos/health-details.dto'

// The endpoint is public: one run serves everyone asking within this window.
const REPORT_TTL_MS = 10_000

// Status of each part the app needs, for the status page and uptime checks.
@Injectable()
export class CheckHealthDetailsUseCase {
  private last: { report: HealthDetails; at: number } | null = null
  private running: Promise<HealthDetails> | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageProvider,
    private readonly iceHealth: IceHealthService,
  ) {}

  async execute(): Promise<HealthDetails> {
    if (this.last && Date.now() - this.last.at < REPORT_TTL_MS) return this.last.report

    this.running ??= this.run().finally(() => {
      this.running = null
    })
    return this.running
  }

  private async run(): Promise<HealthDetails> {
    const [database, storage, turn] = await Promise.all([
      probe(() => this.prisma.$queryRaw`SELECT 1`),
      probe(() => this.storage.check()),
      this.iceHealth.check(),
    ])
    const components = turn ? { database, storage, turn } : { database, storage }
    const report = {
      status: overallStatus(components),
      checkedAt: new Date().toISOString(),
      components,
    }
    this.last = { report, at: Date.now() }
    return report
  }
}
