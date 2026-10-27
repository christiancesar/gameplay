// Egress billed by Cloudflare between two dates (UTC days, inclusive). null
// when there is nothing to measure (no SFU app or no Cloudflare TURN key).
export type RealtimeEgress = { sfuBytes: number | null; turnBytes: number | null }

// Where the official SFU and TURN usage comes from.
export abstract class RealtimeUsageProvider {
  abstract readonly configured: boolean
  abstract egress(from: string, to: string): Promise<RealtimeEgress>
}
