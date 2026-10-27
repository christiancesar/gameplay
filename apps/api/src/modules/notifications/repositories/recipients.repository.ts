// Who a platform announcement can reach: accounts that exist.
export abstract class RecipientsRepository {
  abstract allUserIds(): Promise<string[]>
  // The ids among these that belong to an account.
  abstract existingUserIds(userIds: string[]): Promise<string[]>
}
