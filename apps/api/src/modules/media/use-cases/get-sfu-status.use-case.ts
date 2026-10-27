import { Injectable } from '@nestjs/common'
import type { SfuStatusResponse } from '@gameplay/contracts'
import { SfuProvider } from '../providers/sfu/sfu.provider'
import { SfuBudgetService } from '../services/sfu-budget.service'

// Whether the web may offer screen share through the server.
@Injectable()
export class GetSfuStatusUseCase {
  constructor(
    private readonly provider: SfuProvider,
    private readonly budget: SfuBudgetService,
  ) {}

  async execute(): Promise<SfuStatusResponse> {
    if (!this.provider.configured) return { available: false, reason: 'not-configured' }
    if (await this.budget.exhausted()) return { available: false, reason: 'budget-exhausted' }
    return { available: true, reason: null }
  }
}
