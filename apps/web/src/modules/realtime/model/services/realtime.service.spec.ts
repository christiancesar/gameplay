import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FakeSocket } from '../../view-models/test/fake-socket'
import { createRealtimeService, type ConnectionStatus } from './realtime.service'

describe('realtime service', () => {
  const socket = new FakeSocket()
  const service = createRealtimeService(() => socket)

  beforeEach(() => socket.reset())

  it('connects once and disconnects', () => {
    service.connect()
    service.connect()
    expect(socket.connect).toHaveBeenCalledTimes(1)
    service.disconnect()
    expect(socket.disconnect).toHaveBeenCalledTimes(1)
  })

  it('reports connected, reconnecting and disconnected', () => {
    const seen: ConnectionStatus[] = []
    service.onStatusChange((status) => seen.push(status))
    socket.receive('connect')
    socket.receive('disconnect', 'transport close')
    socket.receive('connect_error', new Error('down'))
    socket.active = false
    socket.receive('connect_error', new Error('UNAUTHENTICATED'))
    socket.receive('disconnect', 'io server disconnect')
    expect(seen).toEqual(['connected', 'reconnecting', 'reconnecting', 'disconnected', 'disconnected'])
  })

  it('stops listening after the unsubscribe', () => {
    const handler = vi.fn()
    const stop = service.on('server:changed', handler)
    socket.receive('server:changed', { serverId: 's1' })
    stop()
    socket.receive('server:changed', { serverId: 's1' })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(socket.listenerCount('server:changed')).toBe(0)
  })

  it('subscribes to a server and resolves on ok', async () => {
    await expect(service.subscribeToServer('s1')).resolves.toBeUndefined()
    expect(socket.emitted[0].event).toBe('server:subscribe')
    expect(socket.emitted[0].args[0]).toEqual({ serverId: 's1' })
  })

  it('rejects the subscription when the API refuses', async () => {
    socket.ackReply = { ok: false, error: { code: 'FORBIDDEN', message: 'no' } }
    await expect(service.subscribeToServer('s1')).rejects.toThrow('FORBIDDEN')
  })
})
