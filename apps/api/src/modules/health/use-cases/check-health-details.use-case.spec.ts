import { makeHealthDetailsContext } from '../test/health-context'

describe('CheckHealthDetailsUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-10-26T12:00:00Z'), toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports every component as operational', async () => {
    const { checkHealthDetails } = makeHealthDetailsContext()

    const report = await checkHealthDetails.execute()

    expect(report).toEqual({
      status: 'operational',
      checkedAt: '2026-10-26T12:00:00.000Z',
      components: {
        database: { status: 'operational', latencyMs: expect.any(Number) },
        storage: { status: 'operational', latencyMs: expect.any(Number) },
        turn: { status: 'operational', latencyMs: expect.any(Number) },
      },
    })
  })

  it('leaves TURN out when the server has STUN only', async () => {
    const { checkHealthDetails } = makeHealthDetailsContext({ turn: false })

    const report = await checkHealthDetails.execute()

    expect(report.components).not.toHaveProperty('turn')
    expect(report.status).toBe('operational')
  })

  it('reports an outage when the storage fails', async () => {
    const { checkHealthDetails, storage } = makeHealthDetailsContext()
    storage.failing = true

    const report = await checkHealthDetails.execute()

    expect(report.status).toBe('outage')
    expect(report.components.storage.status).toBe('outage')
  })

  it('reports an outage when the database fails', async () => {
    const { checkHealthDetails } = makeHealthDetailsContext({ queryRaw: () => Promise.reject(new Error('refused')) })

    const report = await checkHealthDetails.execute()

    expect(report.status).toBe('outage')
    expect(report.components.database.status).toBe('outage')
  })

  it('is only degraded when TURN fails', async () => {
    const { checkHealthDetails, iceProvider } = makeHealthDetailsContext()
    iceProvider.failing = true

    const report = await checkHealthDetails.execute()

    expect(report.status).toBe('degraded')
    expect(report.components.turn?.status).toBe('outage')
  })

  it('serves the same report for 10 seconds, then checks again', async () => {
    const { checkHealthDetails, storage } = makeHealthDetailsContext()
    const first = await checkHealthDetails.execute()
    storage.failing = true

    vi.advanceTimersByTime(9_000)
    expect(await checkHealthDetails.execute()).toBe(first)

    vi.advanceTimersByTime(2_000)
    expect((await checkHealthDetails.execute()).status).toBe('outage')
  })

  it('runs the checks once for callers asking at the same time', async () => {
    const { checkHealthDetails } = makeHealthDetailsContext()

    const [a, b] = await Promise.all([checkHealthDetails.execute(), checkHealthDetails.execute()])

    expect(a).toBe(b)
  })
})
