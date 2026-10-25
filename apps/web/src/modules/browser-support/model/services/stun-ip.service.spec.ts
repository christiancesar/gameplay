import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HOST, SRFLX_V4, SRFLX_V6 } from '../test/candidates'
import { createFakePeerConnection, type FakeScript } from '../test/fake-peer-connection'
import { createStunIpService, parseServerReflexiveAddress } from './stun-ip.service'

const servers = [{ urls: ['stun:stun.example.com:3478'] }]

const setup = (script: FakeScript) => {
  const connection = createFakePeerConnection(script)
  const factory = vi.fn(() => connection)
  return { connection, factory, service: createStunIpService(factory, 1000) }
}

describe('parseServerReflexiveAddress', () => {
  it('reads srflx candidates only', () => {
    expect(parseServerReflexiveAddress(SRFLX_V4)).toBe('203.0.113.7')
    expect(parseServerReflexiveAddress(SRFLX_V6)).toBe('2001:db8::7')
    expect(parseServerReflexiveAddress(HOST)).toBeNull()
  })
})

describe('createStunIpService', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('collects the srflx addresses until gathering completes, then closes', async () => {
    const { connection, service } = setup({ candidates: [HOST, SRFLX_V4, SRFLX_V6], complete: true })
    await expect(service.gatherPublicIps(servers)).resolves.toEqual(['203.0.113.7', '2001:db8::7'])
    expect(connection.closed).toBe(true)
  })

  it('uses only the STUN urls', async () => {
    const { factory, service } = setup({ complete: true })
    await service.gatherPublicIps([
      { urls: ['turn:turn.example.com:3478', 'stun:stun.example.com:3478'], username: 'u', credential: 'c' },
      { urls: ['turn:other.example.com'] },
    ])
    expect(factory).toHaveBeenCalledWith({ iceServers: [{ urls: ['stun:stun.example.com:3478'] }] })
  })

  it('does not open a connection without STUN servers', async () => {
    const { factory, service } = setup({})
    await expect(service.gatherPublicIps([{ urls: ['turn:turn.example.com'] }])).resolves.toEqual([])
    expect(factory).not.toHaveBeenCalled()
  })

  it('gives what it has when gathering never completes', async () => {
    const { connection, service } = setup({ candidates: [SRFLX_V4] })
    const result = service.gatherPublicIps(servers)
    await vi.advanceTimersByTimeAsync(1000)
    await expect(result).resolves.toEqual(['203.0.113.7'])
    expect(connection.closed).toBe(true)
  })

  it('returns an empty list when the offer fails', async () => {
    const { connection, service } = setup({ failOffer: true })
    await expect(service.gatherPublicIps(servers)).resolves.toEqual([])
    expect(connection.closed).toBe(true)
  })

  it('returns an empty list when the browser cannot create the connection', async () => {
    const service = createStunIpService(() => {
      throw new Error('no WebRTC')
    })
    await expect(service.gatherPublicIps(servers)).resolves.toEqual([])
  })
})
