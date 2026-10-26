import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { mapAdminError } from '@/modules/admin/model/mappers/admin-error.mapper'

/** `onError` handler for admin mutations: a toast with the mapped message. */
function useAdminErrorToast() {
  const { t } = useTranslation()
  return useCallback((error: unknown) => void toast.error(t(`admin.errors.${mapAdminError(error)}`)), [t])
}

export { useAdminErrorToast }
