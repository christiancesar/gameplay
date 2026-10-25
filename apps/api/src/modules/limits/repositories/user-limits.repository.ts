import type { UserLimits } from '@gameplay/contracts'

export abstract class UserLimitsRepository {
  // null when the user doesn't exist.
  abstract find(userId: string): Promise<UserLimits | null>
  // Returns false when the user doesn't exist.
  abstract set(userId: string, limits: UserLimits): Promise<boolean>
}
