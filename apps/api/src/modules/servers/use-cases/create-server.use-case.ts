import { Injectable } from '@nestjs/common'
import type { ServerDetail } from '@gameplay/contracts'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { ServerLimitReachedError } from '../errors/servers.errors'
import { ServersRepository } from '../repositories/servers.repository'
import { ServerViewsService } from '../services/server-views.service'

type Input = { userId: string; name: string; description?: string | null; defaultRoomName?: string }

const DEFAULT_ROOM_NAME = 'Room 1'

// The creator becomes the owner, and the server starts with one room (it
// takes one of the room slots).
@Injectable()
export class CreateServerUseCase {
  constructor(
    private readonly servers: ServersRepository,
    private readonly limits: EffectiveLimitsService,
    private readonly views: ServerViewsService,
  ) {}

  async execute({ userId, name, description = null, defaultRoomName }: Input): Promise<ServerDetail> {
    const limit = await this.limits.resolve({ kind: 'serversPerUser', userId })
    const { server } = await this.servers.createWithOwner(
      { name, description, ownerId: userId, roomName: defaultRoomName ?? DEFAULT_ROOM_NAME },
      (ownedCount) => {
        if (ownedCount >= limit) throw new ServerLimitReachedError(limit)
      },
    )
    return this.views.detail(server, 'owner')
  }
}
