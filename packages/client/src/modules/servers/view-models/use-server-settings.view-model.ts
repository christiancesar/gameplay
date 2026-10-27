import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'

import { canManageServer } from '@/modules/servers/model/rules/can-manage-server'
import type { ServerSettingsSection } from '@/modules/servers/model/server.search'
import { serverDetailQueryOptions } from '@/modules/servers/model/services/servers.query'

const ROUTE = '/_authed/servers/$serverId' as const

/** Server settings modal shell (F7): open state in the URL, role gate, section navigation. */
function useServerSettingsViewModel() {
  const { serverId } = useParams({ from: ROUTE })
  const { serverSettings: section } = useSearch({ from: ROUTE })
  const navigate = useNavigate()

  const { data: detail } = useQuery({ ...serverDetailQueryOptions(serverId), enabled: section !== undefined })
  const role = detail?.role
  const allowed = role !== undefined && canManageServer(role)

  function setSection(next: ServerSettingsSection | undefined) {
    void navigate({ to: '.', search: (prev) => ({ ...prev, serverSettings: next }), replace: true })
  }

  // A plain member has no settings: closing covers both a typed URL and a demotion while the modal is open.
  useEffect(() => {
    if (section !== undefined && role !== undefined && !canManageServer(role)) {
      void navigate({ to: '.', search: (prev) => ({ ...prev, serverSettings: undefined }), replace: true })
    }
  }, [navigate, role, section])

  return {
    serverId,
    section,
    open: section !== undefined && allowed,
    serverName: detail?.name ?? '',
    pendingRequests: detail?.pendingJoinRequests ?? 0,
    onOpenChange: (open: boolean) => {
      if (!open) setSection(undefined)
    },
    onSectionChange: (next: ServerSettingsSection) => setSection(next),
  }
}

export { useServerSettingsViewModel }
