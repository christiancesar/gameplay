import type { ServerRemoved } from '@gameplay/contracts'

type RemovalNotice = 'notices.kicked' | 'notices.serverDeleted' | 'notices.leftServer'

const NOTICE_BY_REASON: Record<ServerRemoved['reason'], RemovalNotice> = {
  kicked: 'notices.kicked',
  deleted: 'notices.serverDeleted',
  left: 'notices.leftServer',
}

/** i18n key of the F13 toast for each removal reason. */
function removalNoticeKey(reason: ServerRemoved['reason']): RemovalNotice {
  return NOTICE_BY_REASON[reason]
}

/** Reads a server name out of a cached query value (detail or list item) without knowing its exact type. */
function serverNameOf(cached: unknown): string | undefined {
  if (typeof cached !== 'object' || cached === null || !('name' in cached)) return undefined
  return typeof cached.name === 'string' ? cached.name : undefined
}

/** Finds the name of a server in cached values: its detail first, then the list. */
function findServerName(serverId: string, detail: unknown, list: unknown): string | undefined {
  const fromDetail = serverNameOf(detail)
  if (fromDetail) return fromDetail
  if (!Array.isArray(list)) return undefined
  const item = list.find(
    (entry: unknown) => typeof entry === 'object' && entry !== null && 'id' in entry && entry.id === serverId,
  )
  return serverNameOf(item)
}

export { findServerName, removalNoticeKey }
