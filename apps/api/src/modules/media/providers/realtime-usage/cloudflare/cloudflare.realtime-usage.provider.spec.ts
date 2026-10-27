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

const since = new Date('2026-10-01T00:00:00Z')
const until = new Date('2026-10-27T10:00:00Z')

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

    expect(await sut.egress(since, until)).toEqual({ sfuBytes: 5_000, turnBytes: 700 })

    const [url, init] = doFetch.mock.calls[0]
    expect(url).toBe('https://api.cloudflare.com/client/v4/graphql')
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer token-1')
    const { query } = JSON.parse(init?.body as string) as { query: string }
    expect(query).toContain('accountTag: "acc-1"')
    expect(query).toContain(
      'callsUsageAdaptiveGroups(limit: 1, filter: { datetime_geq: "2026-10-01T00:00:00.000Z", datetime_lt: "2026-10-27T10:00:00.000Z", appId: "app-1" })',
    )
    expect(query).toContain(
      'callsTurnUsageAdaptiveGroups(limit: 1, filter: { datetime_geq: "2026-10-01T00:00:00.000Z", datetime_lt: "2026-10-27T10:00:00.000Z", keyId: "key-1" })',
    )
  })

  it('leaves out what is not set up, and counts no rows as zero', async () => {
    const doFetch = fakeFetch(200, accounts([], []))
    const sut = new CloudflareRealtimeUsageProvider({ accountId: 'a', apiToken: 't', sfuAppId: 'app', fetch: doFetch })

    expect(await sut.egress(since, until)).toEqual({ sfuBytes: 0, turnBytes: null })
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
    await expect(sut.egress(since, until)).rejects.toThrow(/not authorized/)

    const refused = fakeFetch(403, { data: null, errors: [{ message: 'forbidden' }] })
    const other = new CloudflareRealtimeUsageProvider({
      accountId: 'a',
      apiToken: 't',
      sfuAppId: 'app',
      fetch: refused,
    })
    await expect(other.egress(since, until)).rejects.toThrow(/403/)
  })

  it('asks per bucket for the chart, with day rows as midnight UTC', async () => {
    const doFetch = fakeFetch(200, {
      data: {
        viewer: {
          accounts: [
            {
              sfu: [
                { dimensions: { at: '2026-10-26' }, sum: { egressBytes: 900 } },
                { dimensions: { at: '2026-10-27' }, sum: { egressBytes: 100 } },
              ],
            },
          ],
        },
      },
      errors: null,
    })
    const sut = new CloudflareRealtimeUsageProvider({ accountId: 'a', apiToken: 't', sfuAppId: 'app', fetch: doFetch })

    const series = await sut.series(since, until, 'day')

    expect(series.sfu).toEqual(
      new Map([
        ['2026-10-26T00:00:00.000Z', 900],
        ['2026-10-27T00:00:00.000Z', 100],
      ]),
    )
    expect(series.turn).toBeNull()
    const { query } = JSON.parse(doFetch.mock.calls[0][1]?.body as string) as { query: string }
    expect(query).toContain('callsUsageAdaptiveGroups(limit: 1000, orderBy: [date_ASC], filter:')
    expect(query).toContain('dimensions { at: date } sum { egressBytes }')
  })
})
