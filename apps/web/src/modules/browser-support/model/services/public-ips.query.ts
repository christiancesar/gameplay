import { queryOptions } from '@tanstack/react-query'

import type { IceServer } from '@gameplay/contracts'

import { browserEnvironment } from './browser-environment.service'

/** Public addresses seen by STUN. One probe per session is enough, so it never goes stale. */
function publicIpsQueryOptions(iceServers: readonly IceServer[] | undefined) {
  return queryOptions({
    queryKey: ['browser-support', 'public-ips', iceServers] as const,
    queryFn: () => browserEnvironment.gatherPublicIps(iceServers ?? []),
    enabled: iceServers !== undefined,
    staleTime: Infinity,
    retry: false,
  })
}

export { publicIpsQueryOptions }
