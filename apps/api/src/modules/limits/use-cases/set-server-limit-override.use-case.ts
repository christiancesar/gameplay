import { Injectable } from '@nestjs/common'
import type { ServerLimits } from '@gameplay/shared'
import { ServerNotFoundError } from '../errors/limits.errors'
import { ServerLimitsRepository } from '../repositories/server-limits.repository'

type Input = { serverId: string; limits: ServerLimits }

// Lowering a limit below the current count only blocks new members and rooms;
// nobody is removed.
@Injectable()
export class SetServerLimitOverrideUseCase {
  constructor(private readonly serverLimits: ServerLimitsRepository) {}

  async execute({ serverId, limits }: Input): Promise<void> {
    if (!(await this.serverLimits.set(serverId, limits))) throw new ServerNotFoundError()
  }
}
