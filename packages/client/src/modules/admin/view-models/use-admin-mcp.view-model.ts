import { useTranslation } from 'react-i18next'

/** The server itself is delivered by DIAG-05; this ViewModel keeps the panel explicit about that state for now. */
function useAdminMcpViewModel() {
  const { t } = useTranslation()

  return {
    state: 'unavailable' as const,
    documentation: [t('admin.mcp.docs.local'), t('admin.mcp.docs.future')],
    onStart: () => undefined,
    onStop: () => undefined,
  }
}

export { useAdminMcpViewModel }
