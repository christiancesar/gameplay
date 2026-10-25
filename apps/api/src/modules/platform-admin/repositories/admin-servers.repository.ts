import type { AdminServerRecord, Page, PageQuery } from '../domain/admin-records'

// Read side of the servers for the admin panel.
export abstract class AdminServersRepository {
  // Newest first; search matches the name.
  abstract list(query: PageQuery): Promise<Page<AdminServerRecord>>
  abstract findById(serverId: string): Promise<AdminServerRecord | null>
}
