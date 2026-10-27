import { Injectable, Logger } from '@nestjs/common'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'

type Input = { budgetGb: number; changedById: string }

// The monthly SFU budget. Lowering it below what was used stops new shares
// through the SFU right away; the ones running go on.
@Injectable()
export class UpdateSfuBudgetUseCase {
  private readonly logger = new Logger(UpdateSfuBudgetUseCase.name)

  constructor(private readonly media: MediaSettingsRepository) {}

  async execute({ budgetGb, changedById }: Input): Promise<void> {
    await this.media.setSfuBudgetGb(budgetGb)
    this.logger.log({ budgetGb, changedById }, 'SFU budget changed')
  }
}
