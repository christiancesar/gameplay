import { Injectable } from '@nestjs/common'
import type { SessionDescription } from '@gameplay/contracts'
import { SfuSessionStore } from '../../realtime/stores/sfu-session.store'
import { SfuTrackNotFoundError } from '../errors/media.errors'
import { SfuAccessService } from '../services/sfu-access.service'
import { SfuProvider } from '../providers/sfu/sfu.provider'

type Input = { userId: string; sessionId: string; mids: string[]; offer?: SessionDescription }

// Stops sending or receiving tracks of the person's own session.
@Injectable()
export class CloseSfuTracksUseCase {
  constructor(
    private readonly provider: SfuProvider,
    private readonly sessions: SfuSessionStore,
    private readonly access: SfuAccessService,
  ) {}

  async execute({ userId, sessionId, mids, offer }: Input): Promise<{ sessionDescription: SessionDescription | null }> {
    const { session } = await this.access.ownSession(userId, sessionId)
    const known = [...session.published, ...session.pulled].map((track) => track.mid)
    if (mids.some((mid) => !known.includes(mid))) throw new SfuTrackNotFoundError()

    const sessionDescription = await this.provider.close(sessionId, mids, offer)
    await this.sessions.removeTracks(sessionId, mids)
    // Nobody can keep watching tracks that are no longer sent.
    const stopped = session.published.filter((track) => mids.includes(track.mid)).map((track) => track.trackName)
    if (stopped.length > 0) await this.sessions.removePullsOf(userId, stopped)
    return { sessionDescription }
  }
}
