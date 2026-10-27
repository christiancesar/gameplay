// SFU traffic per month ("2026-10", UTC).
export abstract class MediaUsageRepository {
  abstract addSfuBytes(month: string, bytes: number): Promise<void>
  abstract sfuBytes(month: string): Promise<number>
}
