import { monthWindow, usageWindow } from './usage-window'

const now = new Date('2026-10-27T15:30:00Z')

describe('usageWindow', () => {
  it('counts a preset back from now', () => {
    expect(usageWindow({ period: '30m' }, now)).toEqual({
      key: '30m',
      since: new Date('2026-10-27T15:00:00Z'),
      until: now,
      bucket: 'minute',
    })
    expect(usageWindow({ period: '7d' }, now)?.since).toEqual(new Date('2026-10-20T15:30:00Z'))
  })

  it('takes a custom range as whole UTC days, stopping at now', () => {
    expect(usageWindow({ period: 'custom', from: '2026-10-01', to: '2026-10-03' }, now)).toEqual({
      key: '2026-10-01..2026-10-03',
      since: new Date('2026-10-01T00:00:00Z'),
      until: new Date('2026-10-04T00:00:00Z'),
      bucket: 'hour',
    })
    expect(usageWindow({ period: 'custom', from: '2026-10-27', to: '2026-10-27' }, now)?.until).toEqual(now)
  })

  it('refuses a custom range older than 30 days or in the future', () => {
    expect(usageWindow({ period: 'custom', from: '2026-09-27', to: '2026-10-01' }, now)).not.toBeNull()
    expect(usageWindow({ period: 'custom', from: '2026-09-26', to: '2026-10-01' }, now)).toBeNull()
    expect(usageWindow({ period: 'custom', from: '2026-10-28', to: '2026-10-29' }, now)).toBeNull()
  })

  it('cuts the chart in buckets that fit the period', () => {
    const bucket = (period: '6h' | '12h' | '24h' | '7d' | '30d') => usageWindow({ period }, now)?.bucket
    expect([bucket('6h'), bucket('12h'), bucket('24h'), bucket('7d'), bucket('30d')]).toEqual([
      'five-minutes',
      'five-minutes',
      'fifteen-minutes',
      'hour',
      'day',
    ])
  })
})

describe('monthWindow', () => {
  it('runs from the first of the month to now', () => {
    expect(monthWindow('2026-10', now)).toEqual({ key: '2026-10', since: new Date('2026-10-01T00:00:00Z'), until: now })
  })
})
