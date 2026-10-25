/** True when `count` already reached `limit` (no room for one more). */
function isAtLimit(count: number, limit: number): boolean {
  return count >= limit
}

export { isAtLimit }
