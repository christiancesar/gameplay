import type { AdminUserRecord, Page, PageQuery } from '../../domain/admin-records'
import { AdminUsersRepository } from '../admin-users.repository'

export class InMemoryAdminUsersRepository extends AdminUsersRepository {
  readonly users: AdminUserRecord[] = []

  async list({ search, page, pageSize }: PageQuery): Promise<Page<AdminUserRecord>> {
    const term = search?.toLowerCase()
    const matching = this.users
      .filter((user) => !term || user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const start = (page - 1) * pageSize
    return { items: matching.slice(start, start + pageSize).map((user) => ({ ...user })), total: matching.length }
  }

  async findById(userId: string): Promise<AdminUserRecord | null> {
    const user = this.users.find(({ id }) => id === userId)
    return user ? { ...user } : null
  }
}
