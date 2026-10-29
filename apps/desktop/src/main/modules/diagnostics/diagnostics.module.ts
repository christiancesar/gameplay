import type { DiagnosticEvent } from '@gameplay/contracts'

const DEFAULT_HISTORY_LIMIT = 500

type DiagnosticsOptions = { enabled: boolean; limit?: number }

class DiagnosticsCollector {
  private readonly enabled: boolean
  private readonly limit: number
  private readonly events: DiagnosticEvent[] = []

  constructor({ enabled, limit = DEFAULT_HISTORY_LIMIT }: DiagnosticsOptions) {
    this.enabled = enabled
    this.limit = Math.max(1, Math.floor(limit))
  }

  isEnabled(): boolean {
    return this.enabled
  }

  record(event: DiagnosticEvent): void {
    if (!this.enabled) return
    this.events.push(event)
    if (this.events.length > this.limit) this.events.splice(0, this.events.length - this.limit)
  }

  history(): readonly DiagnosticEvent[] {
    return this.events
  }
}

function createDiagnosticsModule(options: DiagnosticsOptions) {
  const collector = new DiagnosticsCollector(options)
  return {
    collector,
    handlers: {
      'diagnostics:record': (event: DiagnosticEvent) => collector.record(event),
      'diagnostics:is-enabled': () => collector.isEnabled(),
    },
  }
}

export { DEFAULT_HISTORY_LIMIT, DiagnosticsCollector, createDiagnosticsModule }
