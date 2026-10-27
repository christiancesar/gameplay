import { CloudflareRealtimeUsageProvider } from './cloudflare.realtime-usage.provider'

function fakeFetch(status: number, body: unknown) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
}

const accounts = (sfu: number[], turn: number[]) => ({
  data: {
    viewer: {
      accounts: [
        {
          sfu: sfu.map((egressBytes) => ({ sum: { egressBytes } })),
          turn: turn.map((egressBytes) => ({ sum: { egressBytes } })),
        },
      ],
    },
  },
  errors: null,
})

describe('CloudflareRealtimeUsageProvider', () => {
  it('asks the analytics API for the SFU app and the TURN key in the period', async () => {
    const doFetch = fakeFetch(200, accounts([5_000], [700]))
    const sut = new CloudflareRealtimeUsageProvider({
      accountId: 'acc-1',
      apiToken: 'token-1',
      sfuAppId: 'app-1',
      turnKeyId: 'key-1',
      fetch: doFetch,
    })

    expect(await sut.egress('2026-10-01', '2026-10-27')).toEqual({ sfuBytes: 5_000, turnBytes: 700 })

    const [url, init] = doFetch.mock.calls[0]
    expect(url).toBe('https://api.cloudflare.com/client/v4/graphql')
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer token-1')
    const { query } = JSON.parse(init?.body as string) as { query: string }
    expect(query).toContain('accountTag: "acc-1"')
    expect(query).toContain(
      'callsUsageAdaptiveGroups(limit: 1, filter: { date_geq: "2026-10-01", date_leq: "2026-10-27", appId: "app-1" })',
    )
    expect(query).toContain(
      'callsTurnUsageAdaptiveGroups(limit: 1, filter: { date_geq: "2026-10-01", date_leq: "2026-10-27", keyId: "key-1" })',
    )
  })

  it('leaves out what is not set up, and counts no rows as zero', async () => {
    const doFetch = fakeFetch(200, accounts([], []))
    const sut = new CloudflareRealtimeUsageProvider({ accountId: 'a', apiToken: 't', sfuAppId: 'app', fetch: doFetch })

    expect(await sut.egress('2026-10-01', '2026-10-27')).toEqual({ sfuBytes: 0, turnBytes: null })
    expect(JSON.parse(doFetch.mock.calls[0][1]?.body as string).query).not.toContain('callsTurnUsageAdaptiveGroups')
  })

  it('fails on GraphQL errors or a refused token', async () => {
    const withErrors = fakeFetch(200, { data: null, errors: [{ message: 'not authorized' }] })
    const sut = new CloudflareRealtimeUsageProvider({
      accountId: 'a',
      apiToken: 't',
      sfuAppId: 'app',
      fetch: withErrors,
    })
    await expect(sut.egress('2026-10-01', '2026-10-27')).rejects.toThrow(/not authorized/)

    const refused = fakeFetch(403, { data: null, errors: [{ message: 'forbidden' }] })
    const other = new CloudflareRealtimeUsageProvider({
      accountId: 'a',
      apiToken: 't',
      sfuAppId: 'app',
      fetch: refused,
    })
    await expect(other.egress('2026-10-01', '2026-10-27')).rejects.toThrow(/403/)
  })
})
