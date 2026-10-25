import sharp from 'sharp'
import { ServerNotFoundError, ServerPermissionDeniedError } from '../errors/servers.errors'
import { makeServersContext } from '../test/fakes'
import { CreateServerUseCase } from './create-server.use-case'
import { DeleteServerUseCase } from './delete-server.use-case'
import { GetServerUseCase } from './get-server.use-case'
import { ListMyServersUseCase } from './list-my-servers.use-case'
import { RemoveServerImageUseCase } from './remove-server-image.use-case'
import { UpdateServerUseCase } from './update-server.use-case'
import { UploadServerImageUseCase } from './upload-server-image.use-case'

function png(color: string, width = 800, height = 600) {
  return sharp({ create: { width, height, channels: 3, background: color } })
    .png()
    .toBuffer()
}

describe('Server management', () => {
  async function makeSut() {
    const ctx = makeServersContext()
    ctx.userLimits.users.set('owner', { maxServers: 5 })
    const server = await new CreateServerUseCase(ctx.servers, ctx.limits, ctx.views).execute({
      userId: 'owner',
      name: 'Squad',
    })
    ctx.servers.addMember(server.id, 'admin', 'admin')
    ctx.servers.addMember(server.id, 'member', 'member')
    return {
      ...ctx,
      serverId: server.id,
      get: new GetServerUseCase(ctx.access, ctx.views),
      list: new ListMyServersUseCase(ctx.servers, ctx.views),
      update: new UpdateServerUseCase(ctx.servers, ctx.access, ctx.views, ctx.events),
      upload: new UploadServerImageUseCase(ctx.servers, ctx.access, ctx.images, ctx.storage, ctx.events),
      removeImage: new RemoveServerImageUseCase(ctx.servers, ctx.access, ctx.storage, ctx.events),
      remove: new DeleteServerUseCase(ctx.servers, ctx.access, ctx.storage, ctx.events),
    }
  }

  it('shows the server with the role of who asks', async () => {
    const { get, serverId } = await makeSut()

    await expect(get.execute({ serverId, userId: 'admin' })).resolves.toMatchObject({ role: 'admin', memberCount: 3 })
  })

  it('hides the server from non-members', async () => {
    const { get, serverId } = await makeSut()

    await expect(get.execute({ serverId, userId: 'stranger' })).rejects.toThrow(ServerNotFoundError)
  })

  it('lists the servers of the user', async () => {
    const { list, serverId } = await makeSut()

    await expect(list.execute('member')).resolves.toEqual([
      { id: serverId, name: 'Squad', iconUrl: null, role: 'member' },
    ])
  })

  it.each(['owner', 'admin'])('lets the %s edit and announces it', async (userId) => {
    const { update, serverId, events } = await makeSut()

    const server = await update.execute({
      serverId,
      userId,
      changes: { name: 'Renamed', description: 'Hi', autoApprove: true },
    })

    expect(server).toMatchObject({ name: 'Renamed', description: 'Hi', autoApprove: true })
    expect(events.published).toEqual([{ name: 'server.updated', payload: { serverId } }])
  })

  it('refuses edits from a member', async () => {
    const { update, upload, serverId, events } = await makeSut()

    await expect(update.execute({ serverId, userId: 'member', changes: { name: 'x' } })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
    await expect(upload.execute({ serverId, userId: 'member', kind: 'icon', file: await png('#f00') })).rejects.toThrow(
      ServerPermissionDeniedError,
    )
    expect(events.published).toEqual([])
  })

  it('stores icon and cover in their sizes and replaces the old file', async () => {
    const { upload, get, storage, serverId } = await makeSut()

    const icon = await upload.execute({ serverId, userId: 'admin', kind: 'icon', file: await png('#f00') })
    const cover = await upload.execute({ serverId, userId: 'admin', kind: 'cover', file: await png('#0f0') })
    await upload.execute({ serverId, userId: 'admin', kind: 'icon', file: await png('#00f') })

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
    expect((await get.execute({ serverId, userId: 'member' })).iconUrl).not.toBe(icon.url)
  })

  it('removes the icon and its file', async () => {
    const { upload, removeImage, get, storage, serverId } = await makeSut()
    await upload.execute({ serverId, userId: 'owner', kind: 'icon', file: await png('#f00') })

    await removeImage.execute({ serverId, userId: 'owner', kind: 'icon' })

    expect((await get.execute({ serverId, userId: 'owner' })).iconUrl).toBeNull()
    expect(storage.files.size).toBe(0)
  })

  it('lets only the owner delete, removing everything and announcing the members', async () => {
    const { remove, upload, servers, rooms, storage, events, serverId } = await makeSut()
    await upload.execute({ serverId, userId: 'owner', kind: 'cover', file: await png('#f00') })
    events.published.length = 0

    await expect(remove.execute({ serverId, userId: 'admin' })).rejects.toThrow(ServerPermissionDeniedError)
    await remove.execute({ serverId, userId: 'owner' })

    expect(servers.servers.size).toBe(0)
    expect(servers.members).toEqual([])
    expect(rooms.rooms).toEqual([])
    expect(storage.files.size).toBe(0)
    expect(events.published).toEqual([
      { name: 'server.deleted', payload: { serverId, memberIds: ['owner', 'admin', 'member'] } },
    ])
  })
})
