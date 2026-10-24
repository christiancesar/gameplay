const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]

/** "in 3 days", "2 hours ago", "há 5 minutos". */
export function formatRelativeTime(date: Date | string, language: string, now = Date.now()): string {
  const diff = new Date(date).getTime() - now
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return format.format(Math.round(diff / ms), unit)
  }
  return format.format(0, 'minute')
}
