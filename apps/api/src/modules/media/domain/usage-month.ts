// The month SFU traffic counts against, in UTC: "2026-10".
export function usageMonth(at: Date): string {
  return at.toISOString().slice(0, 7)
}

export const BYTES_PER_GB = 1_000_000_000
