import { StunOnlyIceProvider } from '../../ice/providers/stun-only.ice-provider'
import { IceHealthService } from '../../ice/services/ice-health.service'
import { CountingIceProvider } from '../../ice/test/counting-ice-provider'
import { FALLBACK_STUN_URLS } from '../../ice/test/ice-seed'
import { InMemoryStorageProvider } from '../../storage/drivers/in-memory-storage.provider'
import { CheckHealthDetailsUseCase } from '../use-cases/check-health-details.use-case'
import { CheckHealthUseCase } from '../use-cases/check-health.use-case'
import { fakePrisma } from './fake-prisma'

// CheckHealth over a database that answers the ping with `queryRaw`.
export function makeHealthContext(queryRaw: () => Promise<unknown>) {
  return { checkHealth: new CheckHealthUseCase(fakePrisma(queryRaw)) }
}

const databaseUp = () => Promise.resolve([{ '?column?': 1 }])

// CheckHealthDetails over a healthy database, in-memory storage and a TURN
// provider (or STUN only when `turn` is false). Break parts through the returned fakes.
export function makeHealthDetailsContext({ queryRaw = databaseUp, turn = true } = {}) {
  const storage = new InMemoryStorageProvider()
  const iceProvider = new CountingIceProvider()
  const iceHealth = new IceHealthService(turn ? iceProvider : new StunOnlyIceProvider(FALLBACK_STUN_URLS))
  return {
    storage,
    iceProvider,
    checkHealthDetails: new CheckHealthDetailsUseCase(fakePrisma(queryRaw), storage, iceHealth),
  }
}
