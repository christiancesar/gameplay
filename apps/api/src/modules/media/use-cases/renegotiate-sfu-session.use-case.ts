import { Injectable } from '@nestjs/common'
import type { SessionDescription } from '@gameplay/contracts'
import { SfuAccessService } from '../services/sfu-access.service'
import { SfuProvider } from '../sfu.provider'

type Input = { userId: string; sessionId: string; answer: SessionDescription }

// The browser's answer to an offer from the SFU (after watching a screen).
@Injectable()
export class RenegotiateSfuSessionUseCase {
  constructor(
    private readonly provider: SfuProvider,
    private readonly access: SfuAccessService,
  ) {}

  async execute({ userId, sessionId, answer }: Input): Promise<void> {
    await this.access.ownSession(userId, sessionId)
    await this.provider.renegotiate(sessionId, answer)
  }
}
