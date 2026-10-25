import { Injectable } from '@nestjs/common'
import type { Room } from '@gameplay/shared'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { assertRoomExists, assertRoomNameFree } from '../domain/room-rules'
import { RoomsRepository } from '../repositories/rooms.repository'
import { ServerAccess } from '../services/server-access'
import { toRoom } from '../services/server-views'

type Input = { serverId: string; userId: string; roomId: string; name: string }

@Injectable()
export class RenameRoomUseCase {
  constructor(
    private readonly rooms: RoomsRepository,
    private readonly access: ServerAccess,
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
