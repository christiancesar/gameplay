import { RealtimeUsageProvider } from '../realtime-usage.provider'

// Without the account id or the analytics token: only what viewers report.
export class NotConfiguredRealtimeUsageProvider extends RealtimeUsageProvider {
  readonly configured = false

  async egress(): Promise<never> {
    throw new Error('Cloudflare analytics is not configured')
  }
}
