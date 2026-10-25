import { Injectable } from '@nestjs/common'
import type { Page, PageQuery } from '../domain/admin-records'
import { AdminServersRepository } from '../repositories/admin-servers.repository'
import { type AdminServerView, AdminServerViewsService } from '../services/admin-server-views.service'

// Every server, with owner and counts.
@Injectable()
export class ListServersUseCase {
  constructor(
    private readonly servers: AdminServersRepository,
    private readonly views: AdminServerViewsService,
  ) {}

  async execute(query: PageQuery): Promise<Page<AdminServerView>> {
    const { items, total } = await this.servers.list(query)
    return { items: items.map((server) => this.views.view(server)), total }
  }
}
