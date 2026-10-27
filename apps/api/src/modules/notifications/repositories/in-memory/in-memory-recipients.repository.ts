import { RecipientsRepository } from '../recipients.repository'

export class InMemoryRecipientsRepository extends RecipientsRepository {
  readonly userIds = new Set<string>()

  async allUserIds(): Promise<string[]> {
    return [...this.userIds]
  }

  async existingUserIds(userIds: string[]): Promise<string[]> {
    return userIds.filter((userId) => this.userIds.has(userId))
  }
}
