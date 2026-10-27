import { queryOptions } from '@tanstack/react-query'

import { getServerMedia } from './sfu.service'

/** `media:changed` invalidates `all`. */
const serverMediaKeys = {
  all: ['server-media'] as const,
  detail: (serverId: string) => [...serverMediaKeys.all, serverId] as const,
}

const serverMediaQueryOptions = (serverId: string) =>
  queryOptions({ queryKey: serverMediaKeys.detail(serverId), queryFn: () => getServerMedia(serverId) })

export { serverMediaKeys, serverMediaQueryOptions }
