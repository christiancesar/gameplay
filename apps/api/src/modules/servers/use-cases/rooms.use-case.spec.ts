import {
  InvalidRoomOrderError,
  RoomLimitReachedError,
  RoomNameTakenError,
  RoomNotFoundError,
  ServerPermissionDeniedError,
} from '../errors/servers.errors'
import { makeServersContext } from '../test/servers-context'
import { CreateRoomUseCase } from './create-room.use-case'
import { CreateServerUseCase } from './create-server.use-case'
import { DeleteRoomUseCase } from './delete-room.use-case'
import { RenameRoomUseCase } from './rename-room.use-case'
import { ReorderRoomsUseCase } from './reorder-rooms.use-case'

describe('Rooms', () => {
  async function makeSut() {
    const ctx = makeServersContext()
    const server = await new CreateServerUseCase(ctx.servers, ctx.limits, ctx.views).execute({
      userId: 'owner',
      name: 'Squad',
      defaultRoomName: 'Lobby',
    })
    ctx.servers.addMember(server.id, 'admin', 'admin')
    ctx.servers.addMember(server.id, 'member', 'member')
    return {
      ...ctx,
      serverId: server.id,
      firstRoomId: server.rooms[0].id,
      create: new CreateRoomUseCase(ctx.rooms, ctx.access, ctx.limits, ctx.events),
      rename: new RenameRoomUseCase(ctx.rooms, ctx.access, ctx.events),
      remove: new DeleteRoomUseCase(ctx.rooms, ctx.access, ctx.events),
      reorder: new ReorderRoomsUseCase(ctx.rooms, ctx.access, ctx.events),
    }
  }

  it('creates up to the limit; the first room takes a slot', async () => {
    const { create, serverId, events } = await makeSut()

    await expect(create.execute({ serverId, userId: 'admin', name: 'Games' })).resolves.toMatchObject({
      name: 'Games',
      position: 1,
    })
    await expect(create.execute({ serverId, userId: 'admin', name: 'Third' })).rejects.toThrow(RoomLimitReachedError)
    expect(events.published).toEqual([{ name: 'room.changed', payload: { serverId } }])
  })

  it('follows the server override', async () => {
    const { create, serverId, serverLimits } = await makeSut()
    serverLimits.servers.set(serverId, { maxMembers: null, maxRooms: 3 })

    await create.execute({ serverId, userId: 'owner', name: 'Two' })
    await expect(create.execute({ serverId, userId: 'owner', name: 'Three' })).resolves.toMatchObject({
      position: 2,
    })
  })

  it('refuses a name already used, ignoring case', async () => {
    const { create, serverId } = await makeSut()

    await expect(create.execute({ serverId, userId: 'owner', name: ' LOBBY ' })).rejects.toThrow(RoomNameTakenError)
  })

  it('renames, keeping its own name allowed', async () => {
    const { rename, create, serverId, firstRoomId } = await makeSut()
    await create.execute({ serverId, userId: 'owner', name: 'Games' })

    await expect(
      rename.execute({ serverId, userId: 'owner', roomId: firstRoomId, name: 'lobby' }),
    ).resolves.toMatchObject({ name: 'lobby' })
    await expect(rename.execute({ serverId, userId: 'owner', roomId: firstRoomId, name: 'games' })).rejects.toThrow(
      RoomNameTakenError,
    )
  })

  it('deletes a room and says which one', async () => {
    const { remove, rooms, serverId, firstRoomId, events } = await makeSut()

    await remove.execute({ serverId, userId: 'admin', roomId: firstRoomId })

    expect(rooms.rooms).toEqual([])
    expect(events.published).toEqual([{ name: 'room.changed', payload: { serverId, deletedRoomId: firstRoomId } }])
  })

  it('answers 404 for a room of another server', async () => {
    const { remove, rename, serverId } = await makeSut()

    await expect(remove.execute({ serverId, userId: 'owner', roomId: 'room-x' })).rejects.toThrow(RoomNotFoundError)
    await expect(rename.execute({ serverId, userId: 'owner', roomId: 'room-x', name: 'y' })).rejects.toThrow(
      RoomNotFoundError,
    )
  })

  it('reorders with every room once', async () => {
    const { reorder, create, serverId, firstRoomId } = await makeSut()
    const second = await create.execute({ serverId, userId: 'owner', name: 'Games' })

    const rooms = await reorder.execute({ serverId, userId: 'owner', roomIds: [second.id, firstRoomId] })

    expect(rooms.map((room) => room.name)).toEqual(['Games', 'Lobby'])
    await expect(reorder.execute({ serverId, userId: 'owner', roomIds: [second.id] })).rejects.toThrow(
      InvalidRoomOrderError,
    )
    await expect(reorder.execute({ serverId, userId: 'owner', roomIds: [second.id, second.id] })).rejects.toThrow(
      InvalidRoomOrderError,
    )
  })

  it('refuses every room action from a member', async () => {
    const { create, rename, remove, reorder, serverId, firstRoomId } = await makeSut()
    const actor = { serverId, userId: 'member' }

    await expect(create.execute({ ...actor, name: 'x' })).rejects.toThrow(ServerPermissionDeniedError)
    await expect(rename.execute({ ...actor, roomId: firstRoomId, name: 'x' })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
    await expect(remove.execute({ ...actor, roomId: firstRoomId })).rejects.toThrow(ServerPermissionDeniedError)
    await expect(reorder.execute({ ...actor, roomIds: [firstRoomId] })).rejects.toThrow(ServerPermissionDeniedError)
  })
})
