import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { GlobalLimits } from '@/modules/admin/model/limits.schema'
import { toGlobalLimits, toPlatformSettings } from '@/modules/admin/model/mappers/global-limits.mapper'
import { adminKeys } from '@/modules/admin/model/services/admin.keys'
import { platformSettingsQueryOptions } from '@/modules/admin/model/services/admin.query'
import { updatePlatformSettings } from '@/modules/admin/model/services/admin.service'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'

/** Shown in the form until the settings arrive. */
const LOADING_LIMITS: GlobalLimits = {
  serversPerUser: 1,
  membersPerServer: 1,
  roomsPerServer: 1,
  minChromiumVersion: 1,
}

/** `/admin/limits`: the platform-wide defaults. */
function useAdminLimitsViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const onError = useAdminErrorToast()
  const { data: settings } = useQuery(platformSettingsQueryOptions)

  const save = useMutation({
    mutationFn: (limits: GlobalLimits) => updatePlatformSettings(toPlatformSettings(limits)),
    onSuccess: (saved) => {
      queryClient.setQueryData(adminKeys.settings(), saved)
      toast.success(t('admin.limits.saved'))
    },
    onError,
  })

  return {
    values: settings ? toGlobalLimits(settings) : LOADING_LIMITS,
    isSaving: save.isPending,
    onSave: (limits: GlobalLimits) => save.mutate(limits),
  }
}

export { useAdminLimitsViewModel }
