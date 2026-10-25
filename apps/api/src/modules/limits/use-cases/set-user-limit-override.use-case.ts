import { Injectable } from '@nestjs/common'
import type { UserLimits } from '@gameplay/contracts'
import { UserNotFoundError } from '../errors/limits.errors'
import { UserLimitsRepository } from '../repositories/user-limits.repository'

type Input = { userId: string; limits: UserLimits }

@Injectable()
export class SetUserLimitOverrideUseCase {
  constructor(private readonly userLimits: UserLimitsRepository) {}

  async execute({ userId, limits }: Input): Promise<void> {
    if (!(await this.userLimits.set(userId, limits))) throw new UserNotFoundError()
  }
}
