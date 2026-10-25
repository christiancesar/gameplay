import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FakeSocket } from '../../view-models/test/fake-socket'
import { ACK_TIMEOUT_MS, createRealtimeService, type ConnectionStatus } from './realtime.service'

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

  describe('voice emits', () => {
    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('joins a room and resolves with the participants of the ack', async () => {
      const participants = [{ userId: 'u1', muted: false, deafened: false, streaming: null }]
      socket.ackReply = { ok: true, data: { participants } } as never
      await expect(service.joinRoom({ roomId: 'r1', muted: true, deafened: false })).resolves.toEqual(participants)
      expect(socket.emitted[0].event).toBe('room:join')
      expect(socket.emitted[0].args[0]).toEqual({ roomId: 'r1', muted: true, deafened: false })
    })

    it('rejects a join the API refuses', async () => {
      socket.ackReply = { ok: false, error: { code: 'ROOM_NOT_FOUND', message: 'no' } }
      await expect(service.joinRoom({ roomId: 'x' })).rejects.toThrow('ROOM_NOT_FOUND')
    })

    it('sends leave, voice state and signals with their events', async () => {
      await service.leaveRoom()
      await service.sendVoiceState({ muted: true, deafened: false })
      await service.sendSignal({ to: 'u2', kind: 'offer', data: { a: 1 } })
      expect(socket.emitted.map((entry) => entry.event)).toEqual(['room:leave', 'voice:state', 'signal:send'])
      expect(socket.emitted[2].args[0]).toEqual({ to: 'u2', kind: 'offer', data: { a: 1 } })
    })

    it('sends the screen share events with their payloads', async () => {
      await service.startStream('1080p60')
      await service.watchStream('u2')
      await service.unwatchStream('u2')
      await service.stopStream()
      expect(socket.emitted.map((entry) => [entry.event, entry.args[0]])).toEqual([
        ['stream:start', { preset: '1080p60' }],
        ['stream:watch', { streamerId: 'u2' }],
        ['stream:unwatch', { streamerId: 'u2' }],
        ['stream:stop', {}],
      ])
    })

    it('rejects a watch of someone who is not streaming', async () => {
      socket.ackReply = { ok: false, error: { code: 'NOT_STREAMING', message: 'no' } }
      await expect(service.watchStream('u2')).rejects.toThrow('NOT_STREAMING')
    })

    it('rejects with ACK_TIMEOUT when the socket never answers', async () => {
      vi.useFakeTimers()
      vi.spyOn(socket, 'emit').mockImplementation(() => undefined)
      const pending = expect(service.leaveRoom()).rejects.toThrow('ACK_TIMEOUT')
      await vi.advanceTimersByTimeAsync(ACK_TIMEOUT_MS)
      await pending
    })
  })
})
