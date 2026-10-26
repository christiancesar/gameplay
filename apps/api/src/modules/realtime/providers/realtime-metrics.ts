import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import type { BatchObservableCallback, Meter, Observable } from '@opentelemetry/api'
import { PresenceStore } from '../stores/presence.store'
import { RoomStateStore } from '../stores/room-state.store'

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

// OpenTelemetry instruments over the global meter provider: without an OTLP
// endpoint the SDK never starts and every call is a no-op.
@Injectable()
export class OtelRealtimeMetrics extends RealtimeMetrics implements OnModuleDestroy {
  private readonly sockets
  private readonly connections
  private readonly disconnections
  private readonly rejectedHandshakes
  private readonly handlerDuration
  private readonly gauges: Observable[]
  private readonly observe: BatchObservableCallback

  constructor(
    private readonly meter: Meter,
    presence: PresenceStore,
    rooms: RoomStateStore,
  ) {
    super()
    this.sockets = meter.createUpDownCounter('gameplay.realtime.sockets', {
      description: 'Open Socket.IO connections',
      unit: '{socket}',
    })
    this.connections = meter.createCounter('gameplay.realtime.connections', {
      description: 'Socket.IO connections accepted',
      unit: '{connection}',
    })
    this.disconnections = meter.createCounter('gameplay.realtime.disconnections', {
      description: 'Socket.IO disconnections, by Socket.IO reason',
      unit: '{disconnection}',
    })
    this.rejectedHandshakes = meter.createCounter('gameplay.realtime.handshake.rejected', {
      description: 'Connections refused for lack of a valid session',
      unit: '{connection}',
    })
    this.handlerDuration = meter.createHistogram('gameplay.realtime.handler.duration', {
      description: 'Time to handle a client event, by event and outcome',
      unit: 's',
      advice: { explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5] },
    })

    const usersOnline = meter.createObservableGauge('gameplay.realtime.users.online', {
      description: 'Users with at least one open tab',
      unit: '{user}',
    })
    const participants = meter.createObservableGauge('gameplay.voice.participants', {
      description: 'People in a voice room, waiting reconnections included',
      unit: '{participant}',
    })
    const streams = meter.createObservableGauge('gameplay.voice.streams', {
      description: 'Screens being shared',
      unit: '{stream}',
    })
    this.gauges = [usersOnline, participants, streams]
    this.observe = async (result) => {
      const [online, seats] = await Promise.all([presence.onlineUserIds(), rooms.stats()])
      result.observe(usersOnline, online.length)
      result.observe(participants, seats.seats)
      result.observe(streams, seats.streaming)
    }
    meter.addBatchObservableCallback(this.observe, this.gauges)
  }

  socketOpened(): void {
    this.sockets.add(1)
    this.connections.add(1)
  }

  socketClosed(reason: string): void {
    this.sockets.add(-1)
    this.disconnections.add(1, { 'socket.io.disconnect.reason': reason })
  }

  handshakeRejected(): void {
    this.rejectedHandshakes.add(1)
  }

  handled(event: string, seconds: number, outcome: HandlerOutcome, error?: string): void {
    this.handlerDuration.record(seconds, {
      'socket.io.event': event,
      outcome,
      ...(error ? { 'error.type': error } : {}),
    })
  }

  onModuleDestroy() {
    this.meter.removeBatchObservableCallback(this.observe, this.gauges)
  }
}
