import { Injectable } from '@nestjs/common'
import type { Room } from '@gameplay/contracts'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { assertRoomNameFree } from '../domain/room-rules'
import { RoomLimitReachedError } from '../errors/servers.errors'
import { RoomsRepository } from '../repositories/rooms.repository'
import { ServerAccessService } from '../services/server-access.service'
import { toRoom } from '../services/server-views.service'

type Input = { serverId: string; userId: string; name: string }

// Up to the effective room limit; the name is unique in the server.
@Injectable()
export class CreateRoomUseCase {
  constructor(
    private readonly rooms: RoomsRepository,
    private readonly access: ServerAccessService,
    private readonly limits: EffectiveLimitsService,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, name }: Input): Promise<Room> {
    await this.access.require(serverId, userId, 'manageRooms')
    const limit = await this.limits.resolve({ kind: 'roomsPerServer', serverId })
    const room = await this.rooms.create(serverId, name, (rooms) => {
      if (rooms.length >= limit) throw new RoomLimitReachedError(limit)
      assertRoomNameFree(rooms, name)
    })
    await this.events.publish('room.changed', { serverId })
    return toRoom(room)
  }
}
