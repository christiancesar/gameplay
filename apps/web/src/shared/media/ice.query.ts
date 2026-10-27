import { queryOptions } from '@tanstack/react-query'

import { getIceConfig } from './ice.service'

const iceKeys = { config: ['ice', 'config'] as const }

/** Shared by voice (FE-09) and the VPN notice (FE-12). Fresh until the TURN credentials expire. */
const iceConfigQueryOptions = queryOptions({
  queryKey: iceKeys.config,
  queryFn: () => getIceConfig(),
  staleTime: (query) => Math.max(0, (query.state.data?.ttlSeconds ?? 0) - 60) * 1000,
})

/** For a voice room: the server decides whether TURN credentials come along. */
const serverIceConfigQueryOptions = (serverId: string) =>
  queryOptions({
    queryKey: [...iceKeys.config, serverId] as const,
    queryFn: () => getIceConfig(serverId),
    staleTime: (query) => Math.max(0, (query.state.data?.ttlSeconds ?? 0) - 60) * 1000,
  })

export { iceConfigQueryOptions, iceKeys, serverIceConfigQueryOptions }
