import { Injectable } from '@nestjs/common'
import { StorageProvider } from '../../storage/storage.provider'
import type { AdminServerRecord } from '../domain/admin-records'

export type AdminServerView = Omit<AdminServerRecord, 'iconKey'> & { iconUrl: string | null }

// Turns the stored icon key into its public URL.
@Injectable()
export class AdminServerViewsService {
  constructor(private readonly storage: StorageProvider) {}

  view({ iconKey, ...server }: AdminServerRecord): AdminServerView {
    return { ...server, iconUrl: iconKey ? this.storage.publicUrl(iconKey) : null }
  }
}
