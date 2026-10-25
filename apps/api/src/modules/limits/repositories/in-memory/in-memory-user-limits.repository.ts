import type { UserLimits } from '@gameplay/shared'
import { UserLimitsRepository } from '../user-limits.repository'

export class InMemoryUserLimitsRepository extends UserLimitsRepository {
  // userId -> limits; a user exists when it's in the map.
  readonly users = new Map<string, UserLimits>()

  async find(userId: string): Promise<UserLimits | null> {
    return this.users.get(userId) ?? null
  }

  async set(userId: string, limits: UserLimits): Promise<boolean> {
    if (!this.users.has(userId)) return false
    this.users.set(userId, limits)
    return true
  }
}
