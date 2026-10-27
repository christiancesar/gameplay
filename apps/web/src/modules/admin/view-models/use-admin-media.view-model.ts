import type { MediaNotice, MediaResource } from '@gameplay/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { adminKeys } from '@/modules/admin/model/services/admin.keys'
import { adminMediaQueryOptions } from '@/modules/admin/model/services/admin.query'
import { updateMediaSettings, updateSfuBudget } from '@/modules/admin/model/services/admin.service'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'
import { useMediaOffConfirm } from '@/modules/admin/view-models/use-media-off-confirm'
import { useMediaUsage } from '@/modules/admin/view-models/use-media-usage'

/** `/admin/media`: SFU, Mesh and TURN for the whole platform, who delivers them, their usage, and the servers that differ. */
function useAdminMediaViewModel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const onError = useAdminErrorToast()
  const { data } = useQuery(adminMediaQueryOptions)
  const usage = useMediaUsage()

  const save = useMutation({
    mutationFn: updateMediaSettings,
    onSuccess: async (notified) => {
      confirm.close()
      toast.success(t('admin.media.saved'))
      if (notified > 0) toast.success(t('admin.announcements.sent', { count: notified }))
      await queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
    onError,
  })
  const confirm = useMediaOffConfirm(null, save.isPending)
  const saveBudget = useMutation({
    mutationFn: updateSfuBudget,
    onSuccess: async () => {
      toast.success(t('admin.media.budget.saved'))
      await queryClient.invalidateQueries({ queryKey: adminKeys.media() })
    },
    onError,
  })

  return {
    mediaTab: {
      data,
      isSaving: save.isPending,
      onToggle: (resource: MediaResource, on: boolean) => {
        if (!data) return
        const settings = { ...data.settings, [resource]: on }
        confirm.request(on ? [] : [resource], (notice?: MediaNotice) =>
          // A platform-wide change has no server members to tell.
          save.mutate({
            settings,
            notice: notice && { ...notice, audience: notice.audience === 'everyone' ? 'everyone' : 'affected' },
          }),
        )
      },
      onAdjustServer: (serverId: string) => void navigate({ to: '/admin/servers', search: { edit: serverId } }),
      isSavingBudget: saveBudget.isPending,
      onSaveBudget: (budgetGb: number) => saveBudget.mutate({ budgetGb }),
      usage,
    },
    confirmDialog: confirm.dialog,
  }
}

export { useAdminMediaViewModel }
