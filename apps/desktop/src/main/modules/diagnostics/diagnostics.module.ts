import type { DiagnosticEvent, DiagnosticsStatus } from '@gameplay/contracts'

const DEFAULT_HISTORY_LIMIT = 500

type DiagnosticsOptions = { enabled: boolean; limit?: number; status: DiagnosticsStatus }

class DiagnosticsCollector {
  private readonly enabled: boolean
  private readonly limit: number
  private readonly events: DiagnosticEvent[] = []
  readonly status: DiagnosticsStatus

  constructor({ enabled, limit = DEFAULT_HISTORY_LIMIT, status }: DiagnosticsOptions) {
    this.enabled = enabled
    this.limit = Math.max(1, Math.floor(limit))
    this.status = status
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
      'diagnostics:status': () => collector.status,
    },
  }
}

export { DEFAULT_HISTORY_LIMIT, DiagnosticsCollector, createDiagnosticsModule }
