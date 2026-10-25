import { Injectable } from '@nestjs/common'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { assertRoomExists } from '../domain/room-rules'
import { RoomsRepository } from '../repositories/rooms.repository'
import { ServerAccessService } from '../services/server-access.service'

type Input = { serverId: string; userId: string; roomId: string }

// The event carries the room id so the realtime gateway can take out whoever
// is in it.
@Injectable()
export class DeleteRoomUseCase {
  constructor(
    private readonly rooms: RoomsRepository,
    private readonly access: ServerAccessService,
    private readonly events: DomainEventBus,
  ) {}

  async execute({ serverId, userId, roomId }: Input): Promise<void> {
    await this.access.require(serverId, userId, 'manageRooms')
    assertRoomExists(await this.rooms.list(serverId), roomId)
    await this.rooms.delete(serverId, roomId)
    await this.events.publish('room.changed', { serverId, deletedRoomId: roomId })
  }
}
