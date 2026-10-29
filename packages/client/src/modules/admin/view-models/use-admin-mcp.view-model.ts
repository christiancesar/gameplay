import { useTranslation } from 'react-i18next'

import { useCallback, useEffect, useState } from 'react'

import { usePlatform } from '@/shared/platform/use-platform'

function useAdminMcpViewModel() {
  const { t } = useTranslation()
  const { diagnostics } = usePlatform()
  const [status, setStatus] = useState(diagnostics.mcp.status())

  useEffect(() => {
    if (status.state !== 'active') return
    const interval = window.setInterval(() => {
      void diagnostics.mcp
        .refresh()
        .then(setStatus)
        .catch(() => undefined)
    }, 2000)
    return () => window.clearInterval(interval)
  }, [diagnostics, status.state])

  const onStart = useCallback(async () => {
    setStatus((current) => ({ ...current, state: 'starting' }))
    const next = await diagnostics.mcp.start()
    setStatus(next)
    return next
  }, [diagnostics])

  const onStop = useCallback(async () => {
    const next = await diagnostics.mcp.stop()
    setStatus(next)
    return next
  }, [diagnostics])

  return {
    state: status.state,
    endpoint: status.endpoint ?? undefined,
    token: status.token ?? undefined,
    configuration: status.configuration ?? undefined,
    tools: status.tools,
    clients: status.clients,
    documentation: [t('admin.mcp.docs.local'), t('admin.mcp.docs.future')],
    onStart,
    onStop,
  }
}

export { useAdminMcpViewModel }
