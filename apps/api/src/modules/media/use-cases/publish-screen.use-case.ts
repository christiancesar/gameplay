import { Injectable, Logger } from '@nestjs/common'
import type { SessionDescription, SfuTrack, SfuTracksResponse } from '@gameplay/contracts'
import { SfuSessionStore } from '../../realtime/stores/sfu-session.store'
import { EffectiveMediaService } from '../../limits/services/effective-media.service'
import { SfuDisabledError } from '../errors/media.errors'
import { SfuAccessService } from '../services/sfu-access.service'
import { SfuProvider } from '../providers/sfu/sfu.provider'

type Input = { userId: string; sessionId: string; offer: SessionDescription; tracks: SfuTrack[] }

// The streamer sends their screen (video, and audio when shared) to the SFU.
// stream:start in sfu mode is accepted only after this.
@Injectable()
export class PublishScreenUseCase {
  private readonly logger = new Logger(PublishScreenUseCase.name)

  constructor(
    private readonly provider: SfuProvider,
    private readonly sessions: SfuSessionStore,
    private readonly access: SfuAccessService,
    private readonly media: EffectiveMediaService,
  ) {}

  async execute({ userId, sessionId, offer, tracks }: Input): Promise<SfuTracksResponse> {
    const { seat } = await this.access.ownSession(userId, sessionId)
    if (!(await this.media.isOn(seat.serverId, 'sfu'))) throw new SfuDisabledError()
    const named = tracks.map((track) => ({ ...track, trackName: `screen-${track.kind}-${track.mid}` }))

    const result = await this.provider.publish(
      sessionId,
      offer,
      named.map(({ mid, trackName }) => ({ mid, trackName })),
    )
    await this.sessions.addPublished(sessionId, named)
    this.logger.log(
      { userId, serverId: seat.serverId, roomId: seat.roomId, sessionId, kinds: tracks.map((t) => t.kind) },
      'Screen published to the SFU',
    )
    return {
      sessionDescription: result.sessionDescription,
      requiresImmediateRenegotiation: result.requiresImmediateRenegotiation,
      tracks,
    }
  }
}
