import { CheckHealthUseCase } from '../use-cases/check-health.use-case'
import { fakePrisma } from './fake-prisma'

// CheckHealth over a database that answers the ping with `queryRaw`.
export function makeHealthContext(queryRaw: () => Promise<unknown>) {
  return { checkHealth: new CheckHealthUseCase(fakePrisma(queryRaw)) }
}
