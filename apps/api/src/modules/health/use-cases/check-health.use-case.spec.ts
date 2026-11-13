import { makeHealthContext } from '../test/health-context'

describe('CheckHealthUseCase', () => {
  it('reports ok without touching the database', () => {
    const { checkHealth } = makeHealthContext()

    expect(checkHealth.execute()).toEqual({ status: 'ok' })
  })
})
