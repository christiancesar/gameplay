import { Injectable } from '@nestjs/common'
import type { SfuLayer } from '@gameplay/contracts'
import { SfuTrackNotFoundError } from '../errors/media.errors'
import { SfuAccessService } from '../services/sfu-access.service'
import { SfuProvider } from '../sfu.provider'

type Input = { userId: string; sessionId: string; mid: string; layer: SfuLayer }

// The viewer picks another simulcast layer of a screen they watch.
@Injectable()
export class ChangeSfuLayerUseCase {
  constructor(
    private readonly provider: SfuProvider,
    private readonly access: SfuAccessService,
  ) {}

  async execute({ userId, sessionId, mid, layer }: Input): Promise<void> {
    const { session } = await this.access.ownSession(userId, sessionId)
    const track = session.pulled.find((pulled) => pulled.mid === mid && pulled.kind === 'video')
    if (!track) throw new SfuTrackNotFoundError()
    await this.provider.setLayer(sessionId, mid, {
      sessionId: track.streamerSessionId,
      trackName: track.trackName,
      layer,
    })
  }
}
