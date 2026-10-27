import { fillUsagePoints } from './usage-series'

describe('fillUsagePoints', () => {
  it('puts a zero where Cloudflare had no row, and keeps a missing series null', () => {
    const sfu = new Map([['2026-10-27T11:00:00.000Z', 500]])
    const points = fillUsagePoints(
      new Date('2026-10-27T09:30:00Z'),
      new Date('2026-10-27T12:10:00Z'),
      'hour',
      sfu,
      null,
    )

    expect(points).toEqual([
      { at: '2026-10-27T09:00:00.000Z', sfuBytes: 0, turnBytes: null },
      { at: '2026-10-27T10:00:00.000Z', sfuBytes: 0, turnBytes: null },
      { at: '2026-10-27T11:00:00.000Z', sfuBytes: 500, turnBytes: null },
      { at: '2026-10-27T12:00:00.000Z', sfuBytes: 0, turnBytes: null },
    ])
  })
})
