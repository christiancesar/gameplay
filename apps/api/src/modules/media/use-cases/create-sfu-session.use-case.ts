import { Injectable, Logger } from '@nestjs/common'
import { SfuSessionStore } from '../../realtime/stores/sfu-session.store'
import { SfuNotConfiguredError, SfuSessionLimitError } from '../errors/media.errors'
import { SfuAccessService } from '../services/sfu-access.service'
import { SfuProvider } from '../sfu.provider'

// One to publish and one to watch per tab is the normal case.
export const MAX_SFU_SESSIONS_PER_USER = 4

type Input = { userId: string }

// A new browser connection to the SFU, bound to the person's voice room.
@Injectable()
export class CreateSfuSessionUseCase {
  private readonly logger = new Logger(CreateSfuSessionUseCase.name)

  constructor(
    private readonly provider: SfuProvider,
    private readonly sessions: SfuSessionStore,
    private readonly access: SfuAccessService,
  ) {}

  async execute({ userId }: Input): Promise<{ sessionId: string }> {
    if (!this.provider.configured) throw new SfuNotConfiguredError()
    const { serverId, roomId } = await this.access.seatOf(userId)
    if ((await this.sessions.listByUser(userId)).length >= MAX_SFU_SESSIONS_PER_USER) {
      throw new SfuSessionLimitError()
    }

    const sessionId = await this.provider.newSession()
    await this.sessions.add({ sessionId, userId, serverId, roomId, published: [], pulled: [] })
    this.logger.log({ userId, serverId, roomId, sessionId }, 'SFU session created')
    return { sessionId }
  }
}
