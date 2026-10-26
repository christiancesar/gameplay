import type { CallHandler, ExecutionContext } from '@nestjs/common'
import { MESSAGE_METADATA } from '@nestjs/websockets/constants'
import { lastValueFrom, of, throwError } from 'rxjs'
import { NotInRoomError } from '../errors/realtime.errors'
import { FakeRealtimeMetrics } from '../test/fake-realtime-metrics'
import { RealtimeMetricsInterceptor } from './realtime-metrics.interceptor'

function contextFor(event: string): ExecutionContext {
  const handler = () => undefined
  Reflect.defineMetadata(MESSAGE_METADATA, event, handler)
  return { getHandler: () => handler } as unknown as ExecutionContext
}

const answering = (value: unknown): CallHandler => ({ handle: () => of(value) })
const failing = (error: Error): CallHandler => ({ handle: () => throwError(() => error) })

describe('RealtimeMetricsInterceptor', () => {
  it('records a handled event by its name', async () => {
    const metrics = new FakeRealtimeMetrics()
    const interceptor = new RealtimeMetricsInterceptor(metrics)

    await lastValueFrom(interceptor.intercept(contextFor('room:join'), answering({ ok: true })))

    expect(metrics.handledEvents).toEqual([{ event: 'room:join', outcome: 'ok' }])
  })

  it('records a failure by the domain error code and lets the error through', async () => {
    const metrics = new FakeRealtimeMetrics()
    const interceptor = new RealtimeMetricsInterceptor(metrics)

    await expect(
      lastValueFrom(interceptor.intercept(contextFor('voice:state'), failing(new NotInRoomError()))),
    ).rejects.toBeInstanceOf(NotInRoomError)
    expect(metrics.handledEvents).toEqual([{ event: 'voice:state', outcome: 'error', error: 'NOT_IN_ROOM' }])
  })

  it('names other failures by their class', async () => {
    const metrics = new FakeRealtimeMetrics()
    const interceptor = new RealtimeMetricsInterceptor(metrics)

    await expect(
      lastValueFrom(interceptor.intercept(contextFor('signal:send'), failing(new TypeError('boom')))),
    ).rejects.toThrow('boom')
    expect(metrics.handledEvents).toEqual([{ event: 'signal:send', outcome: 'error', error: 'TypeError' }])
  })
})
