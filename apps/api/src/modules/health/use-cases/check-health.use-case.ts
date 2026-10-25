import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../lib/prisma'
import type { HealthReport } from '../dtos/health-report.dto'

@Injectable()
export class CheckHealthUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<HealthReport> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'ok', database: 'up' }
    } catch {
      return { status: 'error', database: 'down' }
    }
  }
}
