import { UserNotFoundError } from '../errors/limits.errors'
import { makeLimitsContext } from '../test/limits-context'

describe('SetUserLimitOverrideUseCase', () => {
  it('sets and clears the override', async () => {
    const { setUserLimitOverride, userLimits } = makeLimitsContext()

    await setUserLimitOverride.execute({ userId: 'u1', limits: { maxServers: 4 } })
    expect(userLimits.users.get('u1')).toEqual({ maxServers: 4 })

    await setUserLimitOverride.execute({ userId: 'u1', limits: { maxServers: null } })
    expect(userLimits.users.get('u1')).toEqual({ maxServers: null })
  })

  it('refuses an unknown user', async () => {
    const { setUserLimitOverride } = makeLimitsContext()

    await expect(setUserLimitOverride.execute({ userId: 'missing', limits: { maxServers: 1 } })).rejects.toThrow(
      UserNotFoundError,
    )
  })
})
