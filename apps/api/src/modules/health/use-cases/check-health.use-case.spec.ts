import { makeHealthContext } from '../test/health-context'

describe('CheckHealthUseCase', () => {
  it('reports ok when the database answers', async () => {
    const { checkHealth } = makeHealthContext(() => Promise.resolve([{ '?column?': 1 }]))

    await expect(checkHealth.execute()).resolves.toEqual({ status: 'ok', database: 'up' })
  })

  it('reports the database as down when the query fails', async () => {
    const { checkHealth } = makeHealthContext(() => Promise.reject(new Error('connection refused')))

    await expect(checkHealth.execute()).resolves.toEqual({ status: 'error', database: 'down' })
  })
})
