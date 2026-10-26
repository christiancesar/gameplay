import sharp from 'sharp'
import { makeImage } from '../../storage/test/image-seed'
import { ServerNotFoundError, ServerPermissionDeniedError } from '../errors/servers.errors'
import { makeSeededServersContext } from '../test/servers-context'

describe('Server management', () => {
  it('shows the server with the role of who asks', async () => {
    const { getServer, serverId } = await makeSeededServersContext()

    await expect(getServer.execute({ serverId, userId: 'admin' })).resolves.toMatchObject({
      role: 'admin',
      memberCount: 3,
    })
  })

  it('counts the pending join requests for owner and admin, and hides them from members', async () => {
    const { getServer, servers, serverId } = await makeSeededServersContext()
    servers.pendingJoinRequests.set(serverId, 2)

    const counts = await Promise.all(
      ['owner', 'admin', 'member'].map(
        async (userId) => (await getServer.execute({ serverId, userId })).pendingJoinRequests,
      ),
    )

    expect(counts).toEqual([2, 2, null])
  })

  it('hides the server from non-members', async () => {
    const { getServer, serverId } = await makeSeededServersContext()

    await expect(getServer.execute({ serverId, userId: 'stranger' })).rejects.toThrow(ServerNotFoundError)
  })

  it('lists the servers of the user', async () => {
    const { listMyServers, serverId } = await makeSeededServersContext()

    await expect(listMyServers.execute('member')).resolves.toEqual([
      { id: serverId, name: 'Squad', iconUrl: null, role: 'member' },
    ])
  })

  it.each(['owner', 'admin'])('lets the %s edit and announces it', async (userId) => {
    const { updateServer, serverId, events } = await makeSeededServersContext()

    const server = await updateServer.execute({
      serverId,
      userId,
      changes: { name: 'Renamed', description: 'Hi', autoApprove: true },
    })

    expect(server).toMatchObject({ name: 'Renamed', description: 'Hi', autoApprove: true })
    expect(events.published).toEqual([{ name: 'server.updated', payload: { serverId } }])
  })

  it('refuses edits from a member', async () => {
    const { updateServer, uploadImage, serverId, events } = await makeSeededServersContext()

    await expect(updateServer.execute({ serverId, userId: 'member', changes: { name: 'x' } })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
    await expect(
      uploadImage.execute({ serverId, userId: 'member', kind: 'icon', file: await makeImage({ color: '#f00' }) }),
    ).rejects.toThrow(ServerPermissionDeniedError)
    expect(events.published).toEqual([])
  })

  it('stores icon and cover in their sizes and replaces the old file', async () => {
    const { uploadImage, getServer, storage, serverId } = await makeSeededServersContext()

    const icon = await uploadImage.execute({
      serverId,
      userId: 'admin',
      kind: 'icon',
      file: await makeImage({ color: '#f00' }),
    })
    const cover = await uploadImage.execute({
      serverId,
      userId: 'admin',
      kind: 'cover',
      file: await makeImage({ color: '#0f0' }),
    })
    await uploadImage.execute({ serverId, userId: 'admin', kind: 'icon', file: await makeImage({ color: '#00f' }) })

    expect(icon.url).toMatch(/^\/uploads\/icons\//)
    expect(cover.url).toMatch(/^\/uploads\/covers\//)
    const sizes = await Promise.all(
      [...storage.files.entries()].map(async ([key, { body }]) => {
        const { width, height } = await sharp(body).metadata()
        return [key.split('/')[0], width, height]
      }),
    )
    expect(sizes.sort((a, b) => String(a[0]).localeCompare(String(b[0])))).toEqual([
      ['covers', 1280, 720],
      ['icons', 256, 256],
    ])
    expect((await getServer.execute({ serverId, userId: 'member' })).iconUrl).not.toBe(icon.url)
  })

  it('removes the icon and its file', async () => {
    const { uploadImage, removeImage, getServer, storage, serverId } = await makeSeededServersContext()
    await uploadImage.execute({ serverId, userId: 'owner', kind: 'icon', file: await makeImage({ color: '#f00' }) })

    await removeImage.execute({ serverId, userId: 'owner', kind: 'icon' })

    expect((await getServer.execute({ serverId, userId: 'owner' })).iconUrl).toBeNull()
    expect(storage.files.size).toBe(0)
  })

  it('lets only the owner delete, removing everything and announcing the members', async () => {
    const { deleteServer, uploadImage, servers, rooms, storage, events, serverId } = await makeSeededServersContext()
    await uploadImage.execute({ serverId, userId: 'owner', kind: 'cover', file: await makeImage({ color: '#f00' }) })
    events.published.length = 0

    await expect(deleteServer.execute({ serverId, userId: 'admin' })).rejects.toThrow(ServerPermissionDeniedError)
    await deleteServer.execute({ serverId, userId: 'owner' })

    expect(servers.servers.size).toBe(0)
    expect(servers.members).toEqual([])
    expect(rooms.rooms).toEqual([])
    expect(storage.files.size).toBe(0)
    expect(events.published).toEqual([
      {
        name: 'server.deleted',
        payload: { serverId, serverName: 'Squad', memberIds: ['owner', 'admin', 'member'], deletedById: 'owner' },
      },
    ])
  })
})
