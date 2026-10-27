import { Injectable } from '@nestjs/common'
import type { ServerMedia } from '@gameplay/contracts'
import { EffectiveMediaService } from '../../limits/services/effective-media.service'
import { ServerAccessService } from '../../servers/services/server-access.service'
import { SfuProvider } from '../providers/sfu/sfu.provider'

type Input = { userId: string; serverId: string }

// What a server offers its members now: the share dialog and the calls read it.
@Injectable()
export class GetServerMediaUseCase {
  constructor(
    private readonly access: ServerAccessService,
    private readonly media: EffectiveMediaService,
    private readonly sfu: SfuProvider,
  ) {}

  async execute({ userId, serverId }: Input): Promise<ServerMedia> {
    await this.access.member(serverId, userId)
    const { sfu, mesh, turn } = await this.media.forServer(serverId)
    const sfuReason = !sfu ? 'disabled' : !this.sfu.configured ? 'not-configured' : null
    return {
      sfu: { available: sfuReason === null, reason: sfuReason },
      mesh: { available: mesh },
      turn: { available: turn },
    }
  }
}
