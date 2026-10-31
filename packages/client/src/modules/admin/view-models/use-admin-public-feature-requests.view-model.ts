import type { AdminFeatureRequest } from '@gameplay/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { adminKeys } from '@/modules/admin/model/services/admin.keys'
import {
  adminPublicFeatureRequestsQueryOptions,
  adminPublicRoadmapQueryOptions,
} from '@/modules/admin/model/services/admin.query'
import { moderateAdminPublicFeatureRequest } from '@/modules/admin/model/services/admin.service'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'

function useAdminPublicFeatureRequestsViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const onError = useAdminErrorToast()
  const { data } = useQuery(adminPublicFeatureRequestsQueryOptions)
  const { data: roadmap } = useQuery(adminPublicRoadmapQueryOptions)
  const mutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: { status: AdminFeatureRequest['status']; roadmapItemId?: string | null }
    }) => moderateAdminPublicFeatureRequest(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.publicFeatureRequests() })
      toast.success(t('admin.public.notices.moderated'))
    },
    onError,
  })

  return {
    requests: data?.requests ?? [],
    roadmapItems: roadmap?.items ?? [],
    isSaving: mutation.isPending,
    onModerate: (id: string, input: { status: AdminFeatureRequest['status']; roadmapItemId?: string | null }) =>
      mutation.mutate({ id, input }),
  }
}

export { useAdminPublicFeatureRequestsViewModel }
