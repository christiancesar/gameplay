import { Injectable } from '@nestjs/common'
import { ServerNotFoundError } from '../../servers/errors/servers.errors'
import { DeleteServerUseCase } from '../../servers/use-cases/delete-server.use-case'
import { AdminServersRepository } from '../repositories/admin-servers.repository'

// Any server, without being its owner. The delete publishes server.deleted
// with no author, so the owner is notified too and everyone in its voice
// rooms is taken out.
@Injectable()
export class AdminDeleteServerUseCase {
  constructor(
    private readonly servers: AdminServersRepository,
    private readonly deleteServer: DeleteServerUseCase,
  ) {}

  async execute(serverId: string): Promise<void> {
    if (!(await this.servers.findById(serverId))) throw new ServerNotFoundError()
    await this.deleteServer.deleteById(serverId)
  }
}
