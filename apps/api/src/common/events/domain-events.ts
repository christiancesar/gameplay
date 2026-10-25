// Map of every domain event (name -> payload). Each feature adds its own
// events here; publishing an event that is not listed is a type error.
export interface DomainEvents {
  // Name, description, images or auto-approve changed.
  'server.updated': { serverId: string }
  // Published after the delete; memberIds is who belonged to it. deletedById
  // is null when the platform admin deleted it.
  'server.deleted': { serverId: string; serverName: string; memberIds: string[]; deletedById: string | null }
  // Rooms created, renamed, reordered or deleted. deletedRoomId lets the
  // realtime gateway take people out of a deleted room.
  'room.changed': { serverId: string; deletedRoomId?: string }
  // Request waiting for owner or admin.
  'membership.join-requested': { serverId: string; userId: string; requestId: string }
  // Became a member: approved by someone, or auto-approved (approvedById null).
  'membership.approved': { serverId: string; userId: string; approvedById: string | null }
  'membership.declined': { serverId: string; userId: string; declinedById: string }
  'membership.removed': { serverId: string; userId: string; reason: 'kick' | 'leave' }
  'membership.role-changed': { serverId: string; userId: string; role: 'admin' | 'member' }
  // A sign-up came with a server invite that had expired meanwhile; the Hub
  // tells the new user to ask for another one.
  'server-invite.expired-on-sign-up': { userId: string; serverId: string; serverName: string }
  // Published by the platform admin panel (BE-15); the realtime gateway
  // closes the person's sockets.
  'user.suspended': { userId: string }
  'user.sessions-revoked': { userId: string }
  // One session ended; the gateway closes the sockets of that session only.
  'user.session-revoked': { userId: string; sessionId: string }
  // A Hub notification was stored; the gateway tells the user's tabs.
  'notification.created': { userId: string; notificationId: string }
}

export type DomainEventName = Extract<keyof DomainEvents, string>
