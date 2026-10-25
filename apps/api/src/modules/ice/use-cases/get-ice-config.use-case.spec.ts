import { Logger } from '@nestjs/common'
import { IceProvider, type IssuedIce } from '../ice.provider'
import { StunOnlyIceProvider } from '../providers/stun-only.ice-provider'
import { GetIceConfigUseCase } from './get-ice-config.use-case'

class CountingIceProvider extends IceProvider {
  calls = 0
  failing = false

  async issue(userId: string): Promise<IssuedIce> {
    if (this.failing) throw new Error('down')
    this.calls += 1
    return {
      iceServers: [{ urls: ['turn:t:3478'], username: `${userId}-${this.calls}`, credential: 'x' }],
      ttlSeconds: 3600,
    }
  }
}

describe('GetIceConfigUseCase', () => {
  function makeSut() {
    const provider = new CountingIceProvider()
    const sut = new GetIceConfigUseCase(provider, new StunOnlyIceProvider(['stun:s:3478']))
    return { sut, provider }
  }

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-10-24T12:00:00Z') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reuses the credentials while more than half of the TTL is left', async () => {
    const { sut, provider } = makeSut()
    await sut.execute('u1')

    vi.advanceTimersByTime(20 * 60 * 1000)
    const again = await sut.execute('u1')

    expect(provider.calls).toBe(1)
    expect(again.ttlSeconds).toBe(40 * 60)
  })

  it('issues new credentials past half of the TTL', async () => {
    const { sut, provider } = makeSut()
    await sut.execute('u1')

    vi.advanceTimersByTime(31 * 60 * 1000)
    const again = await sut.execute('u1')

    expect(provider.calls).toBe(2)
    expect(again.ttlSeconds).toBe(3600)
  })

  it('keeps users apart', async () => {
    const { sut, provider } = makeSut()

    await sut.execute('u1')
    const other = await sut.execute('u2')

    expect(provider.calls).toBe(2)
    expect(other.iceServers[0].username).toBe('u2-2')
  })

  it('answers with STUN only for a minute when the provider fails', async () => {
    const { sut, provider } = makeSut()
    provider.failing = true
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})

    const issued = await sut.execute('u1')

    expect(issued).toEqual({ iceServers: [{ urls: ['stun:s:3478'] }], ttlSeconds: 60 })
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})
