import { CHECK_TIMEOUT_MS, probe } from './probe'

const after = (ms: number, fail = false) =>
  new Promise((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error('host 10.0.0.1 refused')) : resolve('ok')), ms),
  )

describe('probe', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is operational when the check passes quickly', async () => {
    const report = probe(() => after(20))
    await vi.advanceTimersByTimeAsync(20)

    expect(await report).toEqual({ status: 'operational', latencyMs: 20 })
  })

  it('is degraded when the check passes slowly', async () => {
    const report = probe(() => after(1500))
    await vi.advanceTimersByTimeAsync(1500)

    expect(await report).toEqual({ status: 'degraded', latencyMs: 1500 })
  })

  it('is an outage when the check fails, without the error', async () => {
    const report = probe(() => after(10, true))
    await vi.advanceTimersByTimeAsync(10)

    expect(await report).toEqual({ status: 'outage', latencyMs: 10 })
  })

  it('is an outage when the check never answers', async () => {
    const report = probe(() => new Promise(() => {}))
    await vi.advanceTimersByTimeAsync(CHECK_TIMEOUT_MS)

    expect(await report).toEqual({ status: 'outage', latencyMs: CHECK_TIMEOUT_MS })
  })
})
