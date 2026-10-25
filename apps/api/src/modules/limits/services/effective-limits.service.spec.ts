import { makeLimitsContext } from '../test/limits-context'

describe('EffectiveLimitsService', () => {
  it('uses the global default without an override', async () => {
    const { limits, settings, userLimits } = makeLimitsContext()
    settings.settings.maxServersPerUser = 3
    userLimits.users.set('u1', { maxServers: null })

    await expect(limits.resolve({ kind: 'serversPerUser', userId: 'u1' })).resolves.toBe(3)
  })

  it.each([5, 0])('prefers the override (%i)', async (override) => {
    const { limits, userLimits } = makeLimitsContext()
    userLimits.users.set('u1', { maxServers: override })

    await expect(limits.resolve({ kind: 'serversPerUser', userId: 'u1' })).resolves.toBe(override)
  })

  it('uses the server override for members and rooms, each on its own', async () => {
    const { limits, serverLimits } = makeLimitsContext()
    serverLimits.servers.set('s1', { maxMembers: 25, maxRooms: null })

    await expect(limits.resolve({ kind: 'membersPerServer', serverId: 's1' })).resolves.toBe(25)
    await expect(limits.resolve({ kind: 'roomsPerServer', serverId: 's1' })).resolves.toBe(2)
  })

  it('uses the global defaults for a server without overrides', async () => {
    const { limits, settings } = makeLimitsContext()
    settings.settings.maxMembersPerServer = 12

    await expect(limits.resolve({ kind: 'membersPerServer', serverId: 'none' })).resolves.toBe(12)
  })
})
