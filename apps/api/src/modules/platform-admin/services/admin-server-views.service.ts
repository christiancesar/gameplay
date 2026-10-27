import { Injectable } from '@nestjs/common'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { StorageProvider } from '../../storage/providers/storage/storage.provider'
import type { AdminServerRecord } from '../domain/admin-records'

export type AdminServerView = Omit<AdminServerRecord, 'iconKey'> & {
  iconUrl: string | null
  effectiveMaxMembers: number
  effectiveMaxRooms: number
}

// Turns the stored icon key into its public URL and resolves the limits in
// force (override or default) with a single read of the defaults.
@Injectable()
export class AdminServerViewsService {
  constructor(
    private readonly storage: StorageProvider,
    private readonly limits: EffectiveLimitsService,
  ) {}

  async view(server: AdminServerRecord): Promise<AdminServerView> {
    return (await this.viewAll([server]))[0]
  }

  async viewAll(servers: AdminServerRecord[]): Promise<AdminServerView[]> {
    const defaults = await this.limits.defaults()
    return servers.map(({ iconKey, ...server }) => ({
      ...server,
      iconUrl: iconKey ? this.storage.publicUrl(iconKey) : null,
      effectiveMaxMembers: server.maxMembersOverride ?? defaults.maxMembers,
      effectiveMaxRooms: server.maxRoomsOverride ?? defaults.maxRooms,
    }))
  }
}
