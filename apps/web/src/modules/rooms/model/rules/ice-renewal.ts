/** The TURN credentials are renewed this long before they expire. */
const RENEW_BEFORE_EXPIRY_S = 90

/**
 * Delay until the next ICE config request, or null when the credentials do not expire (STUN only,
 * `ttlSeconds` 0). Short TTLs renew halfway through, so the timer never fires right away in a loop.
 */
function iceRenewalDelayMs(ttlSeconds: number): number | null {
  if (ttlSeconds <= 0) return null
  return Math.max(ttlSeconds - RENEW_BEFORE_EXPIRY_S, ttlSeconds / 2) * 1000
}

export { iceRenewalDelayMs }
