import { Injectable } from '@nestjs/common'
import type { ServerWithRole } from '../domain/server'
import { type ServerAction, ServerPermissions } from '../domain/server-permissions'
import { ServerNotFoundError, ServerPermissionDeniedError } from '../errors/servers.errors'
import { ServersRepository } from '../repositories/servers.repository'

// Loads the server with the user's role and checks the permission table.
// Exported for memberships, invites and realtime.
@Injectable()
export class ServerAccessService {
  constructor(private readonly servers: ServersRepository) {}

  // Not a member answers the same as a missing server.
  async member(serverId: string, userId: string): Promise<ServerWithRole> {
    const access = await this.servers.findRole(serverId, userId)
    if (!access) throw new ServerNotFoundError()
    return access
  }

  async require(serverId: string, userId: string, action: ServerAction): Promise<ServerWithRole> {
    const access = await this.member(serverId, userId)
    if (!ServerPermissions.can(access.role, action)) throw new ServerPermissionDeniedError()
    return access
  }
}
