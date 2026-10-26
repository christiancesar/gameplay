import { Injectable } from '@nestjs/common'
import { type ComponentReport, probe } from '../../../common/health/probe'
import { IceProvider } from '../ice.provider'
import { StunOnlyIceProvider } from '../providers/stun-only.ice-provider'

// Credentials are issued for this id, never handed to anyone.
const PROBE_USER_ID = 'health-check'
// The public health report may be polled often; the TURN provider is asked at most this often.
const RESULT_TTL_MS = 5 * 60 * 1000

// Whether the TURN relay can issue credentials right now.
@Injectable()
export class IceHealthService {
  private last: { report: ComponentReport; at: number } | null = null
  private running: Promise<ComponentReport> | null = null

  constructor(private readonly provider: IceProvider) {}

  // null when there is no relay to check (STUN only).
  async check(): Promise<ComponentReport | null> {
    if (this.provider instanceof StunOnlyIceProvider) return null
    if (this.last && Date.now() - this.last.at < RESULT_TTL_MS) return this.last.report

    this.running ??= probe(() => this.provider.issue(PROBE_USER_ID)).then((report) => {
      this.last = { report, at: Date.now() }
      this.running = null
      return report
    })
    return this.running
  }
}
