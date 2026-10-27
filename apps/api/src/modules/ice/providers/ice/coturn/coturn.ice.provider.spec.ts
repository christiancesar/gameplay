import { createHmac } from 'node:crypto'
import { CoturnIceProvider } from './coturn.ice.provider'

describe('CoturnIceProvider', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('signs "<expiry>:<userId>" with the shared secret', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-24T12:00:00Z') })
    const sut = new CoturnIceProvider({
      stunUrls: ['stun:turn.example.com:3478'],
      turnUrls: ['turn:turn.example.com:3478?transport=udp'],
      secret: 'shared-secret-123456',
      ttlSeconds: 3600,
    })

    const { iceServers, ttlSeconds } = await sut.issue('u1')

    const expiry = Math.floor(new Date('2026-10-24T13:00:00Z').getTime() / 1000)
    const turn = iceServers[1]
    expect(ttlSeconds).toBe(3600)
    expect(iceServers[0]).toEqual({ urls: ['stun:turn.example.com:3478'] })
    expect(turn.username).toBe(`${expiry}:u1`)
    // The same check coturn runs on its side.
    expect(turn.credential).toBe(createHmac('sha1', 'shared-secret-123456').update(`${expiry}:u1`).digest('base64'))
  })
})
