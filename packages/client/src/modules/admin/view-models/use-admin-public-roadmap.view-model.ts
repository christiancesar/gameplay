import type { CreateRoadmapItem, RoadmapItem, UpdateRoadmapItem } from '@gameplay/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { adminKeys } from '@/modules/admin/model/services/admin.keys'
import { adminPublicRoadmapQueryOptions } from '@/modules/admin/model/services/admin.query'
import { createAdminPublicRoadmap, updateAdminPublicRoadmap } from '@/modules/admin/model/services/admin.service'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'

function useAdminPublicRoadmapViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const onError = useAdminErrorToast()
  const { data } = useQuery(adminPublicRoadmapQueryOptions)
  const [editing, setEditing] = useState<RoadmapItem | null>(null)
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CreateRoadmapItem | UpdateRoadmapItem }) =>
      id ? updateAdminPublicRoadmap(id, input) : createAdminPublicRoadmap(input as CreateRoadmapItem),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.publicRoadmap() })
      setEditing(null)
      toast.success(t(id ? 'admin.public.notices.updated' : 'admin.public.notices.created'))
    },
    onError,
  })

  return {
    items: data?.items ?? [],
    editing,
    isSaving: mutation.isPending,
    onEdit: setEditing,
    onCancel: () => setEditing(null),
    onArchive: (id: string) => mutation.mutate({ id, input: { visibility: 'archived' } }),
    onSubmit: (input: CreateRoadmapItem) => mutation.mutate({ id: editing?.id, input }),
  }
}

export { useAdminPublicRoadmapViewModel }
