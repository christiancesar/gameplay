import { Injectable } from '@nestjs/common'
import { CHECK_TIMEOUT_MS, withTimeout } from '../../../common/health/probe'
import { PrismaService } from '../../../lib/prisma'
import type { HealthReport } from '../dtos/health-report.dto'

// Liveness for Docker and deploys: the process answers and reaches the
// database. External services stay out, so their outages never restart it.
@Injectable()
export class CheckHealthUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<HealthReport> {
    try {
      await withTimeout(this.prisma.$queryRaw`SELECT 1`, CHECK_TIMEOUT_MS)
      return { status: 'ok', database: 'up' }
    } catch {
      return { status: 'error', database: 'down' }
    }
  }
}
