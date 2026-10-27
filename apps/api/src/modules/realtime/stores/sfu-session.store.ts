import type { PublishedTrack, PulledTrack, SfuSession } from '../domain/sfu-session'

// Who owns each SFU session and which tracks it sends and receives. Lives
// with the voice rooms because a screen share in sfu mode needs a published
// screen; the media module writes it. In memory, like RoomStateStore.
export abstract class SfuSessionStore {
  abstract add(session: SfuSession): Promise<void>
  abstract find(sessionId: string): Promise<SfuSession | null>
  abstract listByUser(userId: string): Promise<SfuSession[]>
  // The session where the person publishes their screen, if any.
  abstract publicationOf(userId: string): Promise<SfuSession | null>
  abstract addPublished(sessionId: string, tracks: PublishedTrack[]): Promise<void>
  abstract addPulled(sessionId: string, tracks: PulledTrack[]): Promise<void>
  // Forgets these tracks, sent or received.
  abstract removeTracks(sessionId: string, mids: string[]): Promise<void>
  // Forgets the tracks others pull from this streamer (only these names when given).
  abstract removePullsOf(streamerId: string, trackNames?: string[]): Promise<void>
  abstract remove(sessionId: string): Promise<void>
}
