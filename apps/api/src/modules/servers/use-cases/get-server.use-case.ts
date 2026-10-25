import { Injectable } from '@nestjs/common'
import type { ServerDetail } from '@gameplay/contracts'
import { ServerAccessService } from '../services/server-access.service'
import { ServerViewsService } from '../services/server-views.service'

@Injectable()
export class GetServerUseCase {
  constructor(
    private readonly access: ServerAccessService,
    private readonly views: ServerViewsService,
  ) {}

  async execute({ serverId, userId }: { serverId: string; userId: string }): Promise<ServerDetail> {
    const { server, role } = await this.access.member(serverId, userId)
    return this.views.detail(server, role)
  }
}
