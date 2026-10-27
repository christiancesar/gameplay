import { Injectable, Logger } from '@nestjs/common'
import type { SfuLayer, SfuTracksResponse } from '@gameplay/contracts'
import { NotStreamingError, PeerNotInRoomError } from '../../realtime/errors/realtime.errors'
import { RoomStateStore } from '../../realtime/stores/room-state.store'
import { SfuSessionStore } from '../../realtime/stores/sfu-session.store'
import { SfuFailedError } from '../errors/media.errors'
import { SfuAccessService } from '../services/sfu-access.service'
import { SfuProvider } from '../sfu.provider'

type Input = { userId: string; sessionId: string; streamerId: string; layer: SfuLayer }

// The viewer receives the screen of someone in the same voice room who
// streams through the SFU. The streamer's session id never reaches the web.
@Injectable()
export class WatchScreenUseCase {
  private readonly logger = new Logger(WatchScreenUseCase.name)

  constructor(
    private readonly provider: SfuProvider,
    private readonly seats: RoomStateStore,
    private readonly sessions: SfuSessionStore,
    private readonly access: SfuAccessService,
  ) {}

  async execute({ userId, sessionId, streamerId, layer }: Input): Promise<SfuTracksResponse> {
    const { seat } = await this.access.ownSession(userId, sessionId)
    const streamer = await this.seats.find(streamerId)
    if (streamer?.roomId !== seat.roomId) throw new PeerNotInRoomError()
    const publication = await this.sessions.publicationOf(streamerId)
    if (streamer.streamMode !== 'sfu' || publication?.roomId !== seat.roomId) throw new NotStreamingError()

    const result = await this.provider.pull(
      sessionId,
      publication.published.map(({ kind, trackName }) => ({
        sessionId: publication.sessionId,
        trackName,
        ...(kind === 'video' && { layer }),
      })),
    )
    const pulled = publication.published.map((track) => {
      const mid = result.tracks.find((t) => t.trackName === track.trackName)?.mid
      if (!mid) throw new SfuFailedError()
      return { ...track, mid, streamerId, streamerSessionId: publication.sessionId }
    })
    await this.sessions.addPulled(sessionId, pulled)
    this.logger.log({ userId, streamerId, roomId: seat.roomId, sessionId, layer }, 'Watching a screen through the SFU')
    return {
      sessionDescription: result.sessionDescription,
      requiresImmediateRenegotiation: result.requiresImmediateRenegotiation,
      tracks: pulled.map(({ mid, kind }) => ({ mid, kind })),
    }
  }
}
