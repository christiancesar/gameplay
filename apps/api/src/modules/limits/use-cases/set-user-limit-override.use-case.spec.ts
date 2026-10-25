import { UserNotFoundError } from '../errors/limits.errors'
import { InMemoryUserLimitsRepository } from '../repositories/in-memory/in-memory-user-limits.repository'
import { SetUserLimitOverrideUseCase } from './set-user-limit-override.use-case'

describe('SetUserLimitOverrideUseCase', () => {
  it('sets and clears the override', async () => {
    const userLimits = new InMemoryUserLimitsRepository()
    userLimits.users.set('u1', { maxServers: null })
    const sut = new SetUserLimitOverrideUseCase(userLimits)

    await sut.execute({ userId: 'u1', limits: { maxServers: 4 } })
    expect(userLimits.users.get('u1')).toEqual({ maxServers: 4 })

    await sut.execute({ userId: 'u1', limits: { maxServers: null } })
    expect(userLimits.users.get('u1')).toEqual({ maxServers: null })
  })

  it('refuses an unknown user', async () => {
    const sut = new SetUserLimitOverrideUseCase(new InMemoryUserLimitsRepository())

    await expect(sut.execute({ userId: 'missing', limits: { maxServers: 1 } })).rejects.toThrow(UserNotFoundError)
  })
})
