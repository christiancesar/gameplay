import { z } from 'zod'
import { type RealtimeEgress, RealtimeUsageProvider } from '../realtime-usage.provider'

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

const groupsSchema = z.array(z.object({ sum: z.object({ egressBytes: z.number() }) }))
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

// Cloudflare's GraphQL analytics: callsUsageAdaptiveGroups (SFU, by app) and
// callsTurnUsageAdaptiveGroups (TURN, by key). Without dimensions each query
// sums the whole period into one row.
export class CloudflareRealtimeUsageProvider extends RealtimeUsageProvider {
  readonly configured = true

  constructor(private readonly options: Options) {
    super()
  }

  async egress(from: string, to: string): Promise<RealtimeEgress> {
    const { accountId, apiToken, sfuAppId, turnKeyId, fetch: doFetch = fetch } = this.options
    const range = `date_geq: ${JSON.stringify(from)}, date_leq: ${JSON.stringify(to)}`
    const parts = [
      sfuAppId &&
        `sfu: callsUsageAdaptiveGroups(limit: 1, filter: { ${range}, appId: ${JSON.stringify(sfuAppId)} }) { sum { egressBytes } }`,
      turnKeyId &&
        `turn: callsTurnUsageAdaptiveGroups(limit: 1, filter: { ${range}, keyId: ${JSON.stringify(turnKeyId)} }) { sum { egressBytes } }`,
    ].filter(Boolean)
    if (parts.length === 0) return { sfuBytes: null, turnBytes: null }

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
    const total = (groups?: z.infer<typeof groupsSchema>) =>
      (groups ?? []).reduce((sum, group) => sum + group.sum.egressBytes, 0)
    return {
      sfuBytes: sfuAppId ? total(account?.sfu) : null,
      turnBytes: turnKeyId ? total(account?.turn) : null,
    }
  }
}
