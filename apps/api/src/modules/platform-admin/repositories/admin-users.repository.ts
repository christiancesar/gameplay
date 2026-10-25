import type { AdminUserRecord, Page, PageQuery } from '../domain/admin-records'

// Read side of the users for the admin panel.
export abstract class AdminUsersRepository {
  // Newest first; search matches username or email.
  abstract list(query: PageQuery): Promise<Page<AdminUserRecord>>
  abstract findById(userId: string): Promise<AdminUserRecord | null>
}
