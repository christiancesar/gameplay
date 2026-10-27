import type { EnvService } from '../../../../../env/env.service'
import { HmacTokenHasher } from './hmac.token-hasher.provider'

function makeHasher(secret: string) {
  return new HmacTokenHasher({ get: () => secret } as unknown as EnvService)
}

describe('HmacTokenHasher', () => {
  it('gives the same hash for the same key', () => {
    const hasher = makeHasher('s'.repeat(32))

    expect(hasher.hash('ABC234')).toBe(hasher.hash('ABC234'))
    expect(hasher.hash('ABC234')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('depends on the secret', () => {
    expect(makeHasher('s'.repeat(32)).hash('ABC234')).not.toBe(makeHasher('t'.repeat(32)).hash('ABC234'))
  })
})
