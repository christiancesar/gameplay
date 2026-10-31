import type { ChangelogEntry, CreateChangelogEntry } from '@gameplay/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { adminKeys } from '@/modules/admin/model/services/admin.keys'
import { adminPublicChangelogQueryOptions } from '@/modules/admin/model/services/admin.query'
import { createAdminPublicChangelog, updateAdminPublicChangelog } from '@/modules/admin/model/services/admin.service'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'

function useAdminPublicChangelogViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const onError = useAdminErrorToast()
  const { data } = useQuery(adminPublicChangelogQueryOptions)
  const [editing, setEditing] = useState<ChangelogEntry | null>(null)
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CreateChangelogEntry }) =>
      id ? updateAdminPublicChangelog(id, input) : createAdminPublicChangelog(input),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.publicChangelog() })
      setEditing(null)
      toast.success(t(id ? 'admin.public.notices.updated' : 'admin.public.notices.created'))
    },
    onError,
  })

  return {
    entries: data?.entries ?? [],
    editing,
    isSaving: mutation.isPending,
    onEdit: setEditing,
    onCancel: () => setEditing(null),
    onSubmit: (input: CreateChangelogEntry) => mutation.mutate({ id: editing?.id, input }),
  }
}

export { useAdminPublicChangelogViewModel }
