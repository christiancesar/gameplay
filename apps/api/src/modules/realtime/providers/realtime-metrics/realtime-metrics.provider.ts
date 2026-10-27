export type HandlerOutcome = 'ok' | 'error'

// Counts what happens on the Socket.IO gateway. Attributes stay low
// cardinality (event names, Socket.IO disconnect reasons, error names):
// never user, server or room ids, those go in the logs.
export abstract class RealtimeMetrics {
  abstract socketOpened(): void
  abstract socketClosed(reason: string): void
  abstract handshakeRejected(): void
  abstract handled(event: string, seconds: number, outcome: HandlerOutcome, error?: string): void
}
