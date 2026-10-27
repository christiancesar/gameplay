import { type HandlerOutcome, RealtimeMetrics } from '../providers/realtime-metrics'

// Records each call, in order.
export class FakeRealtimeMetrics extends RealtimeMetrics {
  readonly handledEvents: { event: string; outcome: HandlerOutcome; error?: string }[] = []
  readonly closedReasons: string[] = []
  opened = 0
  rejected = 0

  socketOpened(): void {
    this.opened += 1
  }

  socketClosed(reason: string): void {
    this.closedReasons.push(reason)
  }

  handshakeRejected(): void {
    this.rejected += 1
  }

  handled(event: string, _seconds: number, outcome: HandlerOutcome, error?: string): void {
    this.handledEvents.push({ event, outcome, ...(error ? { error } : {}) })
  }
}
