import { Module } from '@nestjs/common'
import { LimitsModule } from '../limits/limits.module'
import { RoomsController } from './controllers/rooms.controller'
import { ServerImagesController } from './controllers/server-images.controller'
import { ServersController } from './controllers/servers.controller'
import { PrismaRoomsRepository } from './repositories/prisma/prisma-rooms.repository'
import { PrismaServersRepository } from './repositories/prisma/prisma-servers.repository'
import { RoomsRepository } from './repositories/rooms.repository'
import { ServersRepository } from './repositories/servers.repository'
import { ServerAccess } from './services/server-access'
import { ServerViews } from './services/server-views'
import { CreateRoomUseCase } from './use-cases/create-room.use-case'
import { CreateServerUseCase } from './use-cases/create-server.use-case'
import { DeleteRoomUseCase } from './use-cases/delete-room.use-case'
import { DeleteServerUseCase } from './use-cases/delete-server.use-case'
import { GetServerUseCase } from './use-cases/get-server.use-case'
import { ListMyServersUseCase } from './use-cases/list-my-servers.use-case'
import { RemoveServerImageUseCase } from './use-cases/remove-server-image.use-case'
import { RenameRoomUseCase } from './use-cases/rename-room.use-case'
import { ReorderRoomsUseCase } from './use-cases/reorder-rooms.use-case'
import { UpdateServerUseCase } from './use-cases/update-server.use-case'
import { UploadServerImageUseCase } from './use-cases/upload-server-image.use-case'

// Servers (create within the limit, edit, images, delete) and their rooms.
// ServerAccess carries the permission table for the modules that come next.
@Module({
  imports: [LimitsModule],
  controllers: [ServersController, ServerImagesController, RoomsController],
  providers: [
    { provide: ServersRepository, useClass: PrismaServersRepository },
    { provide: RoomsRepository, useClass: PrismaRoomsRepository },
    ServerAccess,
    ServerViews,
    CreateServerUseCase,
    ListMyServersUseCase,
    GetServerUseCase,
    UpdateServerUseCase,
    UploadServerImageUseCase,
    RemoveServerImageUseCase,
    DeleteServerUseCase,
    CreateRoomUseCase,
    RenameRoomUseCase,
    DeleteRoomUseCase,
    ReorderRoomsUseCase,
  ],
  exports: [ServerAccess, ServersRepository, RoomsRepository, DeleteServerUseCase],
})
export class ServersModule {}
