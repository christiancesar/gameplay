import { Injectable } from '@nestjs/common'
import type { ServerSummary } from '@gameplay/shared'
import { ServersRepository } from '../repositories/servers.repository'
import { ServerViewsService } from '../services/server-views.service'

// The Hub list, in the order the user joined.
@Injectable()
export class ListMyServersUseCase {
  constructor(
    private readonly servers: ServersRepository,
    private readonly views: ServerViewsService,
  ) {}

  async execute(userId: string): Promise<ServerSummary[]> {
    const memberships = await this.servers.listForUser(userId)
    return memberships.map(({ server, role }) => this.views.summary(server, role))
  }
}
