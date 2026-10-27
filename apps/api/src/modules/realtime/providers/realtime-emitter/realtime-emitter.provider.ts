import {
  type Announcement,
  type MediaChanged,
  type StreamEnded,
  type StreamReceived,
  type Participant,
  type RoomLeft,
  type ServerRemoved,
  type SignalReceive,
  type StreamQualityLevel,
} from '@gameplay/contracts'

export type MediaAudience = { serverId: string } | { userIds: string[] } | 'everyone'

// What the API tells connected clients without being asked. Use-cases and the
// domain events listener talk to this; tests use a fake.
export abstract class RealtimeEmitter {
  abstract presenceUpdate(serverIds: string[], update: { userId: string; online: boolean }): void
  abstract serverChanged(serverId: string): void
  // Tells each user and makes all their sockets stop following the server.
  abstract serverRemoved(userIds: string[], removal: ServerRemoved): void
  // Tells the user and closes all their sockets.
  abstract sessionRevoked(userId: string): void
  // Tells the sockets of that one session and closes them.
  abstract sessionEnded(sessionId: string): void
  // To who follows the server and to the room itself.
  abstract roomParticipants(serverId: string, roomId: string, participants: Participant[]): void
  // The socket took a seat: it hears about the room even with another server open.
  abstract seatTaken(socketId: string, roomId: string): void
  // The socket lost its seat; with a reason, it is told (it did not ask).
  abstract seatReleased(socketId: string, roomId: string, reason: RoomLeft['reason'] | null): void
  // To the streamer's socket.
  abstract watchRequested(socketId: string, viewerId: string): void
  abstract watchStopped(socketId: string, viewerId: string): void
  abstract qualityRequested(socketId: string, viewerId: string, level: StreamQualityLevel): void
  abstract signal(socketId: string, signal: SignalReceive): void
  // To every tab of the user.
  abstract notificationNew(userId: string, notificationId: string, announcement?: Announcement): void
  // To who follows the server, to some people, or to every socket.
  abstract mediaChanged(to: MediaAudience, change: MediaChanged): void
  // To the streamer's socket: the API stopped the share.
  abstract streamEnded(socketId: string, ended: StreamEnded): void
  // To the streamer's socket: what one viewer receives through the SFU.
  abstract streamReceived(socketId: string, received: StreamReceived): void
}
