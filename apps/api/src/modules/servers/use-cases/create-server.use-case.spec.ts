import { ServerLimitReachedError } from '../errors/servers.errors'
import { makeServersContext } from '../test/servers-context'

describe('CreateServerUseCase', () => {
  it('makes the creator the owner and starts with one room', async () => {
    const { createServer, servers, rooms } = makeServersContext()

    const server = await createServer.execute({ userId: 'u1', name: 'Squad', defaultRoomName: 'Sala 1' })

    expect(server).toMatchObject({ name: 'Squad', role: 'owner', ownerId: 'u1', memberCount: 1 })
    expect(server.rooms).toEqual([{ id: expect.any(String), name: 'Sala 1', position: 0 }])
    expect(server.limits).toEqual({ maxMembers: 10, maxRooms: 2 })
    expect(servers.members).toEqual([expect.objectContaining({ userId: 'u1', role: 'owner' })])
    expect(rooms.rooms).toHaveLength(1)
  })

  it('names the first room "Room 1" when the web sends none', async () => {
    const { createServer } = makeServersContext()

    const server = await createServer.execute({ userId: 'u1', name: 'Squad' })

    expect(server.rooms[0].name).toBe('Room 1')
  })

  it('stops at the effective limit and creates nothing', async () => {
    const { createServer, servers, rooms } = makeServersContext()
    await createServer.execute({ userId: 'u1', name: 'First' })

    await expect(createServer.execute({ userId: 'u1', name: 'Second' })).rejects.toThrow(ServerLimitReachedError)
    expect(servers.servers.size).toBe(1)
    expect(rooms.rooms).toHaveLength(1)
  })

  it('follows the user override', async () => {
    const { createServer, userLimits } = makeServersContext()
    userLimits.users.set('u1', { maxServers: 2 })
    await createServer.execute({ userId: 'u1', name: 'First' })

    await expect(createServer.execute({ userId: 'u1', name: 'Second' })).resolves.toMatchObject({ name: 'Second' })
  })

  it('blocks a user with override 0', async () => {
    const { createServer, userLimits } = makeServersContext()
    userLimits.users.set('u1', { maxServers: 0 })

    await expect(createServer.execute({ userId: 'u1', name: 'First' })).rejects.toThrow(ServerLimitReachedError)
  })

  it('counts only servers the user owns', async () => {
    const { createServer, servers } = makeServersContext()
    const other = await createServer.execute({ userId: 'u2', name: 'Theirs' })
    servers.addMember(other.id, 'u1', 'member')

    await expect(createServer.execute({ userId: 'u1', name: 'Mine' })).resolves.toMatchObject({ role: 'owner' })
  })
})
