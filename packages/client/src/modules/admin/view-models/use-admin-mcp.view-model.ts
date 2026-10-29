import { useTranslation } from 'react-i18next'

import { useCallback, useEffect, useState } from 'react'

import { copyText } from '@/modules/admin/model/services/browser.service'
import { usePlatform } from '@/shared/platform/use-platform'

function formatConfiguration(configuration: string | null): string | undefined {
  if (!configuration) return undefined
  try {
    return JSON.stringify(JSON.parse(configuration), null, 2)
  } catch {
    return configuration
  }
}

function useAdminMcpViewModel() {
  const { t } = useTranslation()
  const { diagnostics } = usePlatform()
  const [status, setStatus] = useState(diagnostics.mcp.status())
  const [copied, setCopied] = useState<'token' | 'configuration' | null>(null)

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

  const onCopyToken = useCallback(async () => {
    if (!status.token) return
    await copyText(status.token)
    setCopied('token')
  }, [status.token])

  const onCopyConfiguration = useCallback(async () => {
    const configuration = formatConfiguration(status.configuration)
    if (!configuration) return
    await copyText(configuration)
    setCopied('configuration')
  }, [status.configuration])

  return {
    state: status.state,
    endpoint: status.endpoint ?? undefined,
    token: status.token ?? undefined,
    configuration: formatConfiguration(status.configuration),
    tools: status.tools,
    clients: status.clients,
    documentation: [t('admin.mcp.docs.local'), t('admin.mcp.docs.future')],
    onStart,
    onStop,
    tokenCopied: copied === 'token',
    configurationCopied: copied === 'configuration',
    onCopyToken,
    onCopyConfiguration,
  }
}

export { useAdminMcpViewModel }
