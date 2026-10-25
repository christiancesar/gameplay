import { Injectable } from '@nestjs/common'
import type { Room } from '@gameplay/shared'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { InvalidRoomOrderError } from '../errors/servers.errors'
import { RoomsRepository } from '../repositories/rooms.repository'
import { ServerAccess } from '../services/server-access'
import { toRoom } from '../services/server-views'

type Input = { serverId: string; userId: string; roomIds: string[] }

// roomIds must list every room of the server once.
@Injectable()
export class ReorderRoomsUseCase {
  constructor(
    private readonly rooms: RoomsRepository,
    private readonly access: ServerAccess,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, roomIds }: Input): Promise<Room[]> {
    await this.access.require(serverId, userId, 'manageRooms')
    const rooms = await this.rooms.reorder(serverId, roomIds, (current) => {
      const ids = new Set(roomIds)
      if (ids.size !== roomIds.length || ids.size !== current.length || current.some((room) => !ids.has(room.id))) {
        throw new InvalidRoomOrderError()
      }
    })
    await this.events.publish('room.changed', { serverId })
    return rooms.map(toRoom)
  }
}
