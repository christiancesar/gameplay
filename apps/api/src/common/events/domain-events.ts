// Map of every domain event (name -> payload). Each feature adds its own
// events here; publishing an event that is not listed is a type error.
export interface DomainEvents {
  // Name, description, images or auto-approve changed.
  'server.updated': { serverId: string }
  // Published after the delete; memberIds is who belonged to it.
  'server.deleted': { serverId: string; memberIds: string[] }
  // Rooms created, renamed, reordered or deleted. deletedRoomId lets the
  // realtime gateway take people out of a deleted room.
  'room.changed': { serverId: string; deletedRoomId?: string }
}

export type DomainEventName = Extract<keyof DomainEvents, string>
