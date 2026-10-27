import { FakeEventBus } from '../../../common/test/fake-event-bus'
import { makeLimitsContext } from '../../limits/test/limits-context'
import { InMemoryStorageProvider } from '../../storage/providers/storage/in-memory/in-memory.storage.provider'
import { ImageProcessor } from '../../storage/images/image-processor'
import { InMemoryRoomsRepository } from '../repositories/in-memory/in-memory-rooms.repository'
import { InMemoryServersRepository } from '../repositories/in-memory/in-memory-servers.repository'
import { ServerAccessService } from '../services/server-access.service'
import { ServerViewsService } from '../services/server-views.service'
import { CreateRoomUseCase } from '../use-cases/create-room.use-case'
import { CreateServerUseCase } from '../use-cases/create-server.use-case'
import { DeleteRoomUseCase } from '../use-cases/delete-room.use-case'
import { DeleteServerUseCase } from '../use-cases/delete-server.use-case'
import { GetMyLimitsUseCase } from '../use-cases/get-my-limits.use-case'
import { GetServerUseCase } from '../use-cases/get-server.use-case'
import { ListMyServersUseCase } from '../use-cases/list-my-servers.use-case'
import { RemoveServerImageUseCase } from '../use-cases/remove-server-image.use-case'
import { RenameRoomUseCase } from '../use-cases/rename-room.use-case'
import { ReorderRoomsUseCase } from '../use-cases/reorder-rooms.use-case'
import { UpdateServerUseCase } from '../use-cases/update-server.use-case'
import { UploadServerImageUseCase } from '../use-cases/upload-server-image.use-case'
import { SEED_MEMBERS, SEED_SERVER } from './servers-seed'

// Every servers use-case wired to in-memory fakes, with no server yet.
export function makeServersContext() {
  const { settings, userLimits, serverLimits, limits, mediaSettings, effectiveMedia } = makeLimitsContext()
  const rooms = new InMemoryRoomsRepository()
  const servers = new InMemoryServersRepository(rooms)
  const storage = new InMemoryStorageProvider()
  const images = new ImageProcessor()
  const events = new FakeEventBus()
  const access = new ServerAccessService(servers)
  const views = new ServerViewsService(servers, rooms, limits, storage)
  return {
    rooms,
    servers,
    settings,
    userLimits,
    serverLimits,
    limits,
    mediaSettings,
    effectiveMedia,
    storage,
    events,
    images,
    access,
    views,
    createServer: new CreateServerUseCase(servers, limits, views),
    getMyLimits: new GetMyLimitsUseCase(servers, limits),
    getServer: new GetServerUseCase(access, views),
    listMyServers: new ListMyServersUseCase(servers, views),
    updateServer: new UpdateServerUseCase(servers, access, views, events),
    uploadImage: new UploadServerImageUseCase(servers, access, images, storage, events),
    removeImage: new RemoveServerImageUseCase(servers, access, storage, events),
    deleteServer: new DeleteServerUseCase(servers, access, storage, events),
    createRoom: new CreateRoomUseCase(rooms, access, limits, events),
    renameRoom: new RenameRoomUseCase(rooms, access, events),
    deleteRoom: new DeleteRoomUseCase(rooms, access, events),
    reorderRooms: new ReorderRoomsUseCase(rooms, access, events),
  }
}

// The same, with the seed server already created and its members added.
export async function makeSeededServersContext() {
  const ctx = makeServersContext()
  const server = await ctx.createServer.execute({
    userId: SEED_SERVER.ownerId,
    name: SEED_SERVER.name,
    defaultRoomName: SEED_SERVER.defaultRoomName,
  })
  for (const { userId, role } of SEED_MEMBERS) ctx.servers.addMember(server.id, userId, role)
  return { ...ctx, serverId: server.id, firstRoomId: server.rooms[0].id }
}
