import { MediaUsageRepository } from '../media-usage.repository'

export class InMemoryMediaUsageRepository extends MediaUsageRepository {
  readonly months = new Map<string, number>()

  async addSfuBytes(month: string, bytes: number): Promise<void> {
    this.months.set(month, (this.months.get(month) ?? 0) + bytes)
  }

  async sfuBytes(month: string): Promise<number> {
    return this.months.get(month) ?? 0
  }
}
