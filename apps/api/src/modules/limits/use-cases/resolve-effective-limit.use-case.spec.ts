import { InMemoryPlatformSettingsRepository } from '../repositories/in-memory/in-memory-platform-settings.repository'
import { InMemoryServerLimitsRepository } from '../repositories/in-memory/in-memory-server-limits.repository'
import { InMemoryUserLimitsRepository } from '../repositories/in-memory/in-memory-user-limits.repository'
import { ResolveEffectiveLimitUseCase } from './resolve-effective-limit.use-case'

describe('ResolveEffectiveLimitUseCase', () => {
  function makeSut() {
    const settings = new InMemoryPlatformSettingsRepository()
    const userLimits = new InMemoryUserLimitsRepository()
    const serverLimits = new InMemoryServerLimitsRepository()
    return {
      sut: new ResolveEffectiveLimitUseCase(settings, userLimits, serverLimits),
      settings,
      userLimits,
      serverLimits,
    }
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

  it('uses the server override for members and rooms, each on its own', async () => {
    const { sut, serverLimits } = makeSut()
    serverLimits.servers.set('s1', { maxMembers: 25, maxRooms: null })

    await expect(sut.execute({ kind: 'membersPerServer', serverId: 's1' })).resolves.toBe(25)
    await expect(sut.execute({ kind: 'roomsPerServer', serverId: 's1' })).resolves.toBe(2)
  })

  it('uses the global defaults for a server without overrides', async () => {
    const { sut, settings } = makeSut()
    settings.settings.maxMembersPerServer = 12

    await expect(sut.execute({ kind: 'membersPerServer', serverId: 'none' })).resolves.toBe(12)
  })
})
