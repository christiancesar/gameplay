import { z } from 'zod'
import type { UsageBucket } from '@gameplay/contracts'
import { type RealtimeEgress, type RealtimeEgressSeries, RealtimeUsageProvider } from '../realtime-usage.provider'

type Options = {
  accountId: string
  apiToken: string
  // The SFU app and the TURN key whose traffic counts; missing ones are not queried.
  sfuAppId?: string
  turnKeyId?: string
  // Injected by the tests.
  fetch?: typeof fetch
}

const API_URL = 'https://api.cloudflare.com/client/v4/graphql'
const TIMEOUT_MS = 10_000

const groupsSchema = z.array(
  z.object({ dimensions: z.object({ at: z.string() }).optional(), sum: z.object({ egressBytes: z.number() }) }),
)
type Groups = z.infer<typeof groupsSchema>
const responseSchema = z.object({
  data: z
    .object({
      viewer: z.object({
        accounts: z.array(z.object({ sfu: groupsSchema.optional(), turn: groupsSchema.optional() })),
      }),
    })
    .nullable()
    .optional(),
  errors: z
    .array(z.object({ message: z.string() }))
    .nullable()
    .optional(),
})

// The time dimension of each bucket. `date` answers "2026-10-27".
const DIMENSIONS: Record<UsageBucket, string> = {
  minute: 'datetimeMinute',
  'five-minutes': 'datetimeFiveMinutes',
  'fifteen-minutes': 'datetimeFifteenMinutes',
  hour: 'datetimeHour',
  day: 'date',
}
// Far above the most buckets a period has (about 170).
const SERIES_LIMIT = 1000

// Cloudflare's GraphQL analytics: callsUsageAdaptiveGroups (SFU, by app) and
// callsTurnUsageAdaptiveGroups (TURN, by key). Without dimensions each query
// sums the whole period into one row. The account can't ask for more than 32
// days, nor for anything older.
export class CloudflareRealtimeUsageProvider extends RealtimeUsageProvider {
  readonly configured = true

  constructor(private readonly options: Options) {
    super()
  }

  async egress(since: Date, until: Date): Promise<RealtimeEgress> {
    const groups = await this.query(since, until, 'limit: 1', '')
    const total = (rows?: Groups) => rows?.reduce((sum, row) => sum + row.sum.egressBytes, 0) ?? null
    return { sfuBytes: total(groups.sfu), turnBytes: total(groups.turn) }
  }

  async series(since: Date, until: Date, bucket: UsageBucket): Promise<RealtimeEgressSeries> {
    const dimension = DIMENSIONS[bucket]
    const groups = await this.query(
      since,
      until,
      `limit: ${SERIES_LIMIT}, orderBy: [${dimension}_ASC]`,
      `dimensions { at: ${dimension} }`,
    )
    const byBucket = (rows?: Groups) => {
      if (!rows) return null
      const series = new Map<string, number>()
      for (const row of rows) {
        const at = row.dimensions?.at ?? ''
        series.set(new Date(at.length === 10 ? `${at}T00:00:00Z` : at).toISOString(), row.sum.egressBytes)
      }
      return series
    }
    return { sfu: byBucket(groups.sfu), turn: byBucket(groups.turn) }
  }

  // Rows of the SFU app and the TURN key; undefined for what is not set up.
  private async query(
    since: Date,
    until: Date,
    args: string,
    fields: string,
  ): Promise<{ sfu?: Groups; turn?: Groups }> {
    const { accountId, apiToken, sfuAppId, turnKeyId, fetch: doFetch = fetch } = this.options
    const range = `datetime_geq: ${JSON.stringify(since.toISOString())}, datetime_lt: ${JSON.stringify(until.toISOString())}`
    const parts = [
      sfuAppId &&
        `sfu: callsUsageAdaptiveGroups(${args}, filter: { ${range}, appId: ${JSON.stringify(sfuAppId)} }) { ${fields} sum { egressBytes } }`,
      turnKeyId &&
        `turn: callsTurnUsageAdaptiveGroups(${args}, filter: { ${range}, keyId: ${JSON.stringify(turnKeyId)} }) { ${fields} sum { egressBytes } }`,
    ].filter(Boolean)
    if (parts.length === 0) return {}

    const query = `{ viewer { accounts(filter: { accountTag: ${JSON.stringify(accountId)} }) { ${parts.join(' ')} } } }`
    const response = await doFetch(API_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const parsed = responseSchema.parse(await response.json())
    if (!response.ok || parsed.errors?.length || !parsed.data) {
      throw new Error(`Cloudflare analytics answered ${response.status}: ${parsed.errors?.[0]?.message ?? 'no data'}`)
    }
    const account = parsed.data.viewer.accounts[0]
    return {
      sfu: sfuAppId ? (account?.sfu ?? []) : undefined,
      turn: turnKeyId ? (account?.turn ?? []) : undefined,
    }
  }
}
