type ServerLimitInput = {
  /** Servers the user owns. */
  ownedCount: number
  /** Per-user limit set by the platform admin (`null` means the global default, which non-admins cannot read). */
  limitOverride: number | null
  /** Owned count at which the API last refused a creation, if it did. */
  refusedAtOwnedCount: number | null
}

/**
 * Whether the Hub should offer "create server". The global default is not exposed to regular users,
 * so without an override the limit is learned from the API refusing a creation.
 */
function canCreateServer({ ownedCount, limitOverride, refusedAtOwnedCount }: ServerLimitInput): boolean {
  if (limitOverride !== null && ownedCount >= limitOverride) return false
  if (refusedAtOwnedCount !== null && ownedCount >= refusedAtOwnedCount) return false
  return true
}

export { canCreateServer }
export type { ServerLimitInput }
