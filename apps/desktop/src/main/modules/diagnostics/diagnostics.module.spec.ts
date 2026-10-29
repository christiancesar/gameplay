import { describe, expect, it } from 'vitest'

import { DiagnosticsCollector } from './diagnostics.module'

const event = (index: number) => ({
  name: 'lifecycle.state.changed' as const,
  attemptId: 'attempt',
  at: new Date(0 + index).toISOString(),
  data: { state: 'started' as const, detail: String(index) },
})

describe('DiagnosticsCollector', () => {
  it('does no work when disabled', () => {
    const collector = new DiagnosticsCollector({
      enabled: false,
      status: { diagnostics: false, cdpPort: null, mainInspectPort: null, devtools: false },
    })

    collector.record(event(1))

    expect(collector.isEnabled()).toBe(false)
    expect(collector.history()).toEqual([])
  })

  it('keeps the newest events up to the configured limit', () => {
    const collector = new DiagnosticsCollector({
      enabled: true,
      limit: 2,
      status: { diagnostics: true, cdpPort: 9223, mainInspectPort: null, devtools: false },
    })

    collector.record(event(1))
    collector.record(event(2))
    collector.record(event(3))

    expect(collector.history().map((entry) => entry.at)).toEqual([new Date(2).toISOString(), new Date(3).toISOString()])
  })

  it('returns events in correlation order', () => {
    const collector = new DiagnosticsCollector({
      enabled: true,
      status: { diagnostics: true, cdpPort: null, mainInspectPort: 9229, devtools: true },
    })
    const first = event(1)
    const second = { ...event(2), attemptId: 'other' }

    collector.record(first)
    collector.record(second)

    expect(collector.history()).toEqual([first, second])
  })
})
