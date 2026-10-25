import type { PrismaService } from '../../../lib/prisma'
import { CheckHealthUseCase } from './check-health.use-case'

function makeSut(queryRaw: () => Promise<unknown>) {
  const prisma = { $queryRaw: queryRaw } as unknown as PrismaService
  return new CheckHealthUseCase(prisma)
}

describe('CheckHealthUseCase', () => {
  it('reports ok when the database answers', async () => {
    const sut = makeSut(() => Promise.resolve([{ '?column?': 1 }]))

    await expect(sut.execute()).resolves.toEqual({ status: 'ok', database: 'up' })
  })

  it('reports the database as down when the query fails', async () => {
    const sut = makeSut(() => Promise.reject(new Error('connection refused')))

    await expect(sut.execute()).resolves.toEqual({ status: 'error', database: 'down' })
  })
})
