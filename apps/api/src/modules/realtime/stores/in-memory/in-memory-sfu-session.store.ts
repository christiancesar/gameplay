import { Injectable } from '@nestjs/common'
import type { PublishedTrack, PulledTrack, SfuSession } from '../../domain/sfu-session'
import { SfuSessionStore } from '../sfu-session.store'

@Injectable()
export class InMemorySfuSessionStore extends SfuSessionStore {
  // Insertion order is the creation order.
  private readonly sessions = new Map<string, SfuSession>()

  async add(session: SfuSession): Promise<void> {
    this.sessions.set(session.sessionId, copy(session))
  }

  async find(sessionId: string): Promise<SfuSession | null> {
    const session = this.sessions.get(sessionId)
    return session ? copy(session) : null
  }

  async listByUser(userId: string): Promise<SfuSession[]> {
    return [...this.sessions.values()].filter((session) => session.userId === userId).map(copy)
  }

  async publicationOf(userId: string): Promise<SfuSession | null> {
    const own = [...this.sessions.values()].filter((s) => s.userId === userId && s.published.length > 0)
    const latest = own.at(-1)
    return latest ? copy(latest) : null
  }

  async addPublished(sessionId: string, tracks: PublishedTrack[]): Promise<void> {
    this.sessions.get(sessionId)?.published.push(...tracks.map((track) => ({ ...track })))
  }

  async addPulled(sessionId: string, tracks: PulledTrack[]): Promise<void> {
    this.sessions.get(sessionId)?.pulled.push(...tracks.map((track) => ({ ...track })))
  }

  async removeTracks(sessionId: string, mids: string[]): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.published = session.published.filter((track) => !mids.includes(track.mid))
    session.pulled = session.pulled.filter((track) => !mids.includes(track.mid))
  }

  async removePullsOf(streamerId: string, trackNames?: string[]): Promise<void> {
    const pulledFrom = (track: PulledTrack) =>
      track.streamerId === streamerId && (!trackNames || trackNames.includes(track.trackName))
    for (const session of this.sessions.values()) {
      session.pulled = session.pulled.filter((track) => !pulledFrom(track))
    }
  }

  async remove(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
  }
}

function copy(session: SfuSession): SfuSession {
  return {
    ...session,
    published: session.published.map((track) => ({ ...track })),
    pulled: session.pulled.map((track) => ({ ...track })),
  }
}
