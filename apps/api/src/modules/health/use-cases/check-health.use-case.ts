import { Injectable } from '@nestjs/common'
import type { HealthReport } from '../dtos/health-report.dto'

// Liveness for Docker and deploys: answers as long as the process is up,
// without touching the database (which bills per query). The database and
// external services are checked by /api/health/details.
@Injectable()
export class CheckHealthUseCase {
  execute(): HealthReport {
    return { status: 'ok' }
  }
}
