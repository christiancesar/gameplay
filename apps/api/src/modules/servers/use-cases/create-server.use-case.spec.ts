import { ServerLimitReachedError } from '../errors/servers.errors'
import { makeServersContext } from '../test/fakes'
import { CreateServerUseCase } from './create-server.use-case'

describe('CreateServerUseCase', () => {
  function makeSut() {
    const ctx = makeServersContext()
    return { ...ctx, sut: new CreateServerUseCase(ctx.servers, ctx.limits, ctx.views) }
  }

  it('makes the creator the owner and starts with one room', async () => {
    const { sut, servers, rooms } = makeSut()

    const server = await sut.execute({ userId: 'u1', name: 'Squad', defaultRoomName: 'Sala 1' })

    expect(server).toMatchObject({ name: 'Squad', role: 'owner', ownerId: 'u1', memberCount: 1 })
    expect(server.rooms).toEqual([{ id: expect.any(String), name: 'Sala 1', position: 0 }])
    expect(server.limits).toEqual({ maxMembers: 10, maxRooms: 2 })
    expect(servers.members).toEqual([expect.objectContaining({ userId: 'u1', role: 'owner' })])
    expect(rooms.rooms).toHaveLength(1)
  })

  it('names the first room "Room 1" when the web sends none', async () => {
    const { sut } = makeSut()

    const server = await sut.execute({ userId: 'u1', name: 'Squad' })

    expect(server.rooms[0].name).toBe('Room 1')
  })

  it('stops at the effective limit and creates nothing', async () => {
    const { sut, servers, rooms } = makeSut()
    await sut.execute({ userId: 'u1', name: 'First' })

    await expect(sut.execute({ userId: 'u1', name: 'Second' })).rejects.toThrow(ServerLimitReachedError)
    expect(servers.servers.size).toBe(1)
    expect(rooms.rooms).toHaveLength(1)
  })

  it('follows the user override', async () => {
    const { sut, userLimits } = makeSut()
    userLimits.users.set('u1', { maxServers: 2 })
    await sut.execute({ userId: 'u1', name: 'First' })

    await expect(sut.execute({ userId: 'u1', name: 'Second' })).resolves.toMatchObject({ name: 'Second' })
  })

  it('blocks a user with override 0', async () => {
    const { sut, userLimits } = makeSut()
    userLimits.users.set('u1', { maxServers: 0 })

    await expect(sut.execute({ userId: 'u1', name: 'First' })).rejects.toThrow(ServerLimitReachedError)
  })

  it('counts only servers the user owns', async () => {
    const { sut, servers } = makeSut()
    const other = await sut.execute({ userId: 'u2', name: 'Theirs' })
    servers.addMember(other.id, 'u1', 'member')

    await expect(sut.execute({ userId: 'u1', name: 'Mine' })).resolves.toMatchObject({ role: 'owner' })
  })
})
