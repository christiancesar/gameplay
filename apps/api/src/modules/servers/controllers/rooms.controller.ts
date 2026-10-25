import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type { ListRoomsResponse, Room } from '@gameplay/shared'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { ListRoomsResponseDto, ReorderRoomsRequestDto, RoomDto, RoomNameRequestDto } from '../dtos/server.dto'
import { CreateRoomUseCase } from '../use-cases/create-room.use-case'
import { DeleteRoomUseCase } from '../use-cases/delete-room.use-case'
import { RenameRoomUseCase } from '../use-cases/rename-room.use-case'
import { ReorderRoomsUseCase } from '../use-cases/reorder-rooms.use-case'

// Rooms are listed with the server (GET /servers/:serverId).
@ApiTags('servers')
@Controller('servers/:serverId/rooms')
export class RoomsController {
  constructor(
    private readonly createRoom: CreateRoomUseCase,
    private readonly renameRoom: RenameRoomUseCase,
    private readonly deleteRoom: DeleteRoomUseCase,
    private readonly reorderRooms: ReorderRoomsUseCase,
  ) {}

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: RoomDto })
  create(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Body() body: RoomNameRequestDto,
  ): Promise<Room> {
    return this.createRoom.execute({ serverId, userId: user.id, name: body.name })
  }

  // Declared before :roomId so "order" isn't read as a room id.
  @Put('order')
  @ZodResponse({ status: HttpStatus.OK, type: ListRoomsResponseDto })
  async reorder(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Body() body: ReorderRoomsRequestDto,
  ): Promise<ListRoomsResponse> {
    return { rooms: await this.reorderRooms.execute({ serverId, userId: user.id, roomIds: body.roomIds }) }
  }

  @Patch(':roomId')
  @ZodResponse({ status: HttpStatus.OK, type: RoomDto })
  rename(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Param('roomId') roomId: string,
    @Body() body: RoomNameRequestDto,
  ): Promise<Room> {
    return this.renameRoom.execute({ serverId, userId: user.id, roomId, name: body.name })
  }

  @Delete(':roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Param('roomId') roomId: string,
  ): Promise<void> {
    await this.deleteRoom.execute({ serverId, userId: user.id, roomId })
  }
}
