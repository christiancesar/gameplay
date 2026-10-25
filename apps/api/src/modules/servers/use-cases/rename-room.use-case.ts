import { Injectable } from '@nestjs/common'
import type { Room } from '@gameplay/contracts'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { assertRoomExists, assertRoomNameFree } from '../domain/room-rules'
import { RoomsRepository } from '../repositories/rooms.repository'
import { ServerAccessService } from '../services/server-access.service'
import { toRoom } from '../services/server-views.service'

type Input = { serverId: string; userId: string; roomId: string; name: string }

@Injectable()
export class RenameRoomUseCase {
  constructor(
    private readonly rooms: RoomsRepository,
    private readonly access: ServerAccessService,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, roomId, name }: Input): Promise<Room> {
    await this.access.require(serverId, userId, 'manageRooms')
    const room = await this.rooms.rename(serverId, roomId, name, (rooms) => {
      assertRoomExists(rooms, roomId)
      assertRoomNameFree(rooms, name, roomId)
    })
    await this.events.publish('room.changed', { serverId })
    return toRoom(room)
  }
}
