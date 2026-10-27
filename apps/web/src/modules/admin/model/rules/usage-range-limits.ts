import { USAGE_MAX_DAYS } from '@gameplay/contracts'

const DAY_MS = 24 * 60 * 60 * 1000
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** Dias (UTC) que um período personalizado pode usar: a Cloudflare guarda só os últimos 30. */
function usageRangeLimits(now: Date) {
  return { min: day(now.getTime() - USAGE_MAX_DAYS * DAY_MS), max: day(now.getTime()) }
}

/** O período personalizado sugerido ao abrir: os últimos 7 dias, hoje incluso. */
function defaultUsageRange(now: Date) {
  return { from: day(now.getTime() - 6 * DAY_MS), to: day(now.getTime()) }
}

export { defaultUsageRange, usageRangeLimits }
