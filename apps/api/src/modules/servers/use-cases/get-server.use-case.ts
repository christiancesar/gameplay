import { Injectable } from '@nestjs/common'
import type { ServerDetail } from '@gameplay/shared'
import { ServerAccess } from '../services/server-access'
import { ServerViews } from '../services/server-views'

@Injectable()
export class GetServerUseCase {
  constructor(
    private readonly access: ServerAccess,
    private readonly views: ServerViews,
  ) {}

  async execute({ serverId, userId }: { serverId: string; userId: string }): Promise<ServerDetail> {
    const { server, role } = await this.access.member(serverId, userId)
    return this.views.detail(server, role)
  }
}
