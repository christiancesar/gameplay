// Who is online: a user with at least one connected socket (any tab).
// In memory for the single MVP instance; async so Redis can replace it.
export abstract class PresenceStore {
  // True when this is the user's first socket (went online).
  abstract add(userId: string, socketId: string): Promise<boolean>
  // True when it was the user's last socket (went offline).
  abstract remove(userId: string, socketId: string): Promise<boolean>
  abstract isOnline(userId: string): Promise<boolean>
  // The online ones among userIds, in the same order.
  abstract onlineAmong(userIds: string[]): Promise<string[]>
  // Everyone online, for the platform admin panel.
  abstract onlineUserIds(): Promise<string[]>
}
