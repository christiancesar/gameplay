import type { RealtimeUsageQuery, UsagePeriod } from '@gameplay/contracts'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { defaultUsageRange, usageRangeLimits } from '@/modules/admin/model/rules/usage-range-limits'
import { mediaUsageQueryOptions } from '@/modules/admin/model/services/admin.query'
import type { UsageRangeValues } from '@/modules/admin/model/usage-range.schema'
import { toApiError } from '@/shared/lib/api-error'

/** The usage chart of the Media tab: the period picked (24 hours at first) and what Cloudflare billed in it. */
function useMediaUsage() {
  const [query, setQuery] = useState<RealtimeUsageQuery>({ period: '24h' })
  const { data, isFetching, error } = useQuery(mediaUsageQueryOptions(query))
  // The day the tab opened: the limits move only on a reload.
  const [now] = useState(() => new Date())
  const range = query.period === 'custom' && query.from && query.to ? { from: query.from, to: query.to } : null

  return {
    data,
    isFetching,
    period: query.period,
    range: range ?? defaultUsageRange(now),
    limits: usageRangeLimits(now),
    rangeError: error && toApiError(error).code === 'USAGE_PERIOD_OUT_OF_RANGE' ? ('outOfRange' as const) : undefined,
    onPeriodChange: (period: UsagePeriod) =>
      setQuery(period === 'custom' ? { period, ...(range ?? defaultUsageRange(now)) } : { period }),
    onApplyRange: (values: UsageRangeValues) => setQuery({ period: 'custom', ...values }),
  }
}

export { useMediaUsage }
