import { InMemoryPlatformSettingsRepository } from '../repositories/in-memory/in-memory-platform-settings.repository'
import { InMemoryUserLimitsRepository } from '../repositories/in-memory/in-memory-user-limits.repository'
import { ResolveEffectiveLimitUseCase } from './resolve-effective-limit.use-case'

describe('ResolveEffectiveLimitUseCase', () => {
  function makeSut() {
    const settings = new InMemoryPlatformSettingsRepository()
    const userLimits = new InMemoryUserLimitsRepository()
    return { sut: new ResolveEffectiveLimitUseCase(settings, userLimits), settings, userLimits }
  }

  it('uses the global default without an override', async () => {
    const { sut, settings, userLimits } = makeSut()
    settings.settings.maxServersPerUser = 3
    userLimits.users.set('u1', { maxServers: null })

    await expect(sut.execute({ kind: 'serversPerUser', userId: 'u1' })).resolves.toBe(3)
  })

  it.each([5, 0])('prefers the override (%i)', async (override) => {
    const { sut, userLimits } = makeSut()
    userLimits.users.set('u1', { maxServers: override })

    await expect(sut.execute({ kind: 'serversPerUser', userId: 'u1' })).resolves.toBe(override)
  })
})
