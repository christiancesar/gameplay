import {
  InvalidRoomOrderError,
  RoomLimitReachedError,
  RoomNameTakenError,
  RoomNotFoundError,
  ServerPermissionDeniedError,
} from '../errors/servers.errors'
import { makeSeededServersContext } from '../test/servers-context'

describe('Rooms', () => {
  it('creates up to the limit; the first room takes a slot', async () => {
    const { createRoom, serverId, events } = await makeSeededServersContext()

    await expect(createRoom.execute({ serverId, userId: 'admin', name: 'Games' })).resolves.toMatchObject({
      name: 'Games',
      position: 1,
    })
    await expect(createRoom.execute({ serverId, userId: 'admin', name: 'Third' })).rejects.toThrow(
      RoomLimitReachedError,
    )
    expect(events.published).toEqual([{ name: 'room.changed', payload: { serverId } }])
  })

  it('follows the server override', async () => {
    const { createRoom, serverId, serverLimits } = await makeSeededServersContext()
    serverLimits.servers.set(serverId, { maxMembers: null, maxRooms: 3 })

    await createRoom.execute({ serverId, userId: 'owner', name: 'Two' })
    await expect(createRoom.execute({ serverId, userId: 'owner', name: 'Three' })).resolves.toMatchObject({
      position: 2,
    })
  })

  it('refuses a name already used, ignoring case', async () => {
    const { createRoom, serverId } = await makeSeededServersContext()

    await expect(createRoom.execute({ serverId, userId: 'owner', name: ' LOBBY ' })).rejects.toThrow(RoomNameTakenError)
  })

  it('renames, keeping its own name allowed', async () => {
    const { renameRoom, createRoom, serverId, firstRoomId } = await makeSeededServersContext()
    await createRoom.execute({ serverId, userId: 'owner', name: 'Games' })

    await expect(
      renameRoom.execute({ serverId, userId: 'owner', roomId: firstRoomId, name: 'lobby' }),
    ).resolves.toMatchObject({ name: 'lobby' })
    await expect(renameRoom.execute({ serverId, userId: 'owner', roomId: firstRoomId, name: 'games' })).rejects.toThrow(
      RoomNameTakenError,
    )
  })

  it('deletes a room and says which one', async () => {
    const { deleteRoom, rooms, serverId, firstRoomId, events } = await makeSeededServersContext()

    await deleteRoom.execute({ serverId, userId: 'admin', roomId: firstRoomId })

    expect(rooms.rooms).toEqual([])
    expect(events.published).toEqual([{ name: 'room.changed', payload: { serverId, deletedRoomId: firstRoomId } }])
  })

  it('answers 404 for a room of another server', async () => {
    const { deleteRoom, renameRoom, serverId } = await makeSeededServersContext()

    await expect(deleteRoom.execute({ serverId, userId: 'owner', roomId: 'room-x' })).rejects.toThrow(RoomNotFoundError)
    await expect(renameRoom.execute({ serverId, userId: 'owner', roomId: 'room-x', name: 'y' })).rejects.toThrow(
      RoomNotFoundError,
    )
  })

  it('reorders with every room once', async () => {
    const { reorderRooms, createRoom, serverId, firstRoomId } = await makeSeededServersContext()
    const second = await createRoom.execute({ serverId, userId: 'owner', name: 'Games' })

    const rooms = await reorderRooms.execute({ serverId, userId: 'owner', roomIds: [second.id, firstRoomId] })

    expect(rooms.map((room) => room.name)).toEqual(['Games', 'Lobby'])
    await expect(reorderRooms.execute({ serverId, userId: 'owner', roomIds: [second.id] })).rejects.toThrow(
      InvalidRoomOrderError,
    )
    await expect(reorderRooms.execute({ serverId, userId: 'owner', roomIds: [second.id, second.id] })).rejects.toThrow(
      InvalidRoomOrderError,
    )
  })

  it('refuses every room action from a member', async () => {
    const { createRoom, renameRoom, deleteRoom, reorderRooms, serverId, firstRoomId } = await makeSeededServersContext()
    const actor = { serverId, userId: 'member' }

    await expect(createRoom.execute({ ...actor, name: 'x' })).rejects.toThrow(ServerPermissionDeniedError)
    await expect(renameRoom.execute({ ...actor, roomId: firstRoomId, name: 'x' })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
    await expect(deleteRoom.execute({ ...actor, roomId: firstRoomId })).rejects.toThrow(ServerPermissionDeniedError)
    await expect(reorderRooms.execute({ ...actor, roomIds: [firstRoomId] })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
  })
})
