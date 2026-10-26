import { makeServersContext } from '../test/servers-context'

describe('GetMyLimitsUseCase', () => {
  it('gives the default limit and how many servers the user owns', async () => {
    const { getMyLimits, createServer } = makeServersContext()
    await createServer.execute({ userId: 'u1', name: 'First' })

    await expect(getMyLimits.execute('u1')).resolves.toEqual({ maxServers: 1, ownedServers: 1 })
    await expect(getMyLimits.execute('u2')).resolves.toEqual({ maxServers: 1, ownedServers: 0 })
  })

  it('follows the override of the user', async () => {
    const { getMyLimits, userLimits } = makeServersContext()
    userLimits.users.set('u1', { maxServers: 5 })

    await expect(getMyLimits.execute('u1')).resolves.toEqual({ maxServers: 5, ownedServers: 0 })
  })
})
