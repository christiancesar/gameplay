import { type CollectionResult, MeterProvider, MetricReader } from '@opentelemetry/sdk-metrics'
import type { Seat } from '../domain/seat'
import { InMemoryPresenceStore } from '../stores/in-memory/in-memory-presence.store'
import { InMemoryRoomStateStore } from '../stores/in-memory/in-memory-room-state.store'
import { OtelRealtimeMetrics } from './realtime-metrics'

// Collects on demand, no exporter.
class ManualReader extends MetricReader {
  protected async onForceFlush() {}
  protected async onShutdown() {}
}

const seat = (userId: string, streaming: Seat['streaming'] = null): Seat => ({
  userId,
  serverId: 's1',
  roomId: 'r1',
  socketId: `${userId}-tab`,
  muted: false,
  deafened: false,
  streaming,
  streamMode: streaming ? 'mesh' : null,
})

function pointsOf(result: CollectionResult, name: string) {
  const metric = result.resourceMetrics.scopeMetrics
    .flatMap((scope) => scope.metrics)
    .find((m) => m.descriptor.name === name)
  return metric?.dataPoints ?? []
}

function valueOf(result: CollectionResult, name: string) {
  return pointsOf(result, name)[0]?.value
}

describe('OtelRealtimeMetrics', () => {
  async function setup() {
    const reader = new ManualReader()
    const provider = new MeterProvider({ readers: [reader] })
    const presence = new InMemoryPresenceStore()
    const rooms = new InMemoryRoomStateStore()
    const metrics = new OtelRealtimeMetrics(provider.getMeter('test'), presence, rooms)
    return { reader, presence, rooms, metrics }
  }

  it('reads users online, participants and streams from the stores', async () => {
    const { reader, presence, rooms } = await setup()
    await presence.add('ana', 'ana-tab')
    await presence.add('bia', 'bia-tab')
    await rooms.join('ana', () => seat('ana', '720p30'))
    await rooms.join('bia', () => seat('bia'))

    const result = await reader.collect()

    expect(valueOf(result, 'gameplay.realtime.users.online')).toBe(2)
    expect(valueOf(result, 'gameplay.voice.participants')).toBe(2)
    expect(valueOf(result, 'gameplay.voice.streams')).toBe(1)
  })

  it('tracks open sockets and disconnections by reason', async () => {
    const { reader, metrics } = await setup()
    metrics.socketOpened()
    metrics.socketOpened()
    metrics.socketClosed('transport close')

    const result = await reader.collect()

    expect(valueOf(result, 'gameplay.realtime.sockets')).toBe(1)
    expect(valueOf(result, 'gameplay.realtime.connections')).toBe(2)
    expect(pointsOf(result, 'gameplay.realtime.disconnections')).toEqual([
      expect.objectContaining({ attributes: { 'socket.io.disconnect.reason': 'transport close' }, value: 1 }),
    ])
  })

  it('records handler timings by event and outcome, without ids', async () => {
    const { reader, metrics } = await setup()
    metrics.handled('room:join', 0.02, 'ok')
    metrics.handled('room:join', 0.03, 'error', 'NOT_FOUND')

    const points = pointsOf(await reader.collect(), 'gameplay.realtime.handler.duration')

    expect(points.map(({ attributes }) => attributes)).toEqual([
      { 'socket.io.event': 'room:join', outcome: 'ok' },
      { 'socket.io.event': 'room:join', outcome: 'error', 'error.type': 'NOT_FOUND' },
    ])
  })
})
