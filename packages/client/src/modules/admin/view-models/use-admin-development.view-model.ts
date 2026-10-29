import { useTranslation } from 'react-i18next'

import { usePlatform } from '@/shared/platform/use-platform'

function useAdminDevelopmentViewModel() {
  const { t } = useTranslation()
  const { diagnostics } = usePlatform()

  return {
    status: diagnostics.status,
    documentation: [t('admin.development.docs.local'), t('admin.development.docs.remote')],
  }
}

export { useAdminDevelopmentViewModel }
