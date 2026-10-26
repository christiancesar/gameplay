import { overallStatus } from './overall-status'

const ok = { status: 'operational', latencyMs: 5 } as const
const slow = { status: 'degraded', latencyMs: 1500 } as const
const down = { status: 'outage', latencyMs: 2000 } as const

describe('overallStatus', () => {
  it('is operational when every component is', () => {
    expect(overallStatus({ database: ok, storage: ok, turn: ok })).toBe('operational')
    expect(overallStatus({ database: ok, storage: ok })).toBe('operational')
  })

  it('is an outage without the database or the storage', () => {
    expect(overallStatus({ database: down, storage: ok, turn: ok })).toBe('outage')
    expect(overallStatus({ database: ok, storage: down, turn: ok })).toBe('outage')
  })

  it('is degraded when TURN is down or a component is slow', () => {
    expect(overallStatus({ database: ok, storage: ok, turn: down })).toBe('degraded')
    expect(overallStatus({ database: slow, storage: ok })).toBe('degraded')
  })
})
