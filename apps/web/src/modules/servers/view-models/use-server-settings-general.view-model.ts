import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { mapImageUploadError } from '@/modules/servers/model/mappers/image-upload-error.mapper'
import { validateIconFile } from '@/modules/servers/model/rules/validate-icon-file'
import type { ServerGeneralValues } from '@/modules/servers/model/server.schema'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { serverDetailQueryOptions } from '@/modules/servers/model/services/servers.query'
import {
  removeServerCover,
  removeServerIcon,
  updateServer,
  uploadServerCover,
  uploadServerIcon,
} from '@/modules/servers/model/services/servers.service'
import type { ImageError } from '@/shared/lib/image-error'

import { useServerSettingsFailureViewModel } from './use-server-settings-failure.view-model'

type ImageKind = 'icon' | 'cover'

/** Settings > General: name, description, icon and cover. */
function useServerSettingsGeneralViewModel(serverId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const onFailure = useServerSettingsFailureViewModel(serverId)
  const { data: detail } = useQuery(serverDetailQueryOptions(serverId))
  const [errors, setErrors] = useState<Partial<Record<ImageKind, ImageError>>>({})

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: serversKeys.detail(serverId) }),
      queryClient.invalidateQueries({ queryKey: serversKeys.list() }),
    ])

  const setError = (kind: ImageKind, error: ImageError | undefined) => setErrors((prev) => ({ ...prev, [kind]: error }))

  const save = useMutation({
    mutationFn: (values: ServerGeneralValues) => updateServer(serverId, values),
    onSuccess: async () => {
      await refresh()
      toast.success(t('serverSettings.general.saved'))
    },
    onError: onFailure,
  })

  const upload = useMutation({
    mutationFn: ({ kind, file }: { kind: ImageKind; file: File }) =>
      kind === 'icon' ? uploadServerIcon(serverId, file) : uploadServerCover(serverId, file),
    onSuccess: () => refresh(),
    onError: (error, { kind }) => setError(kind, mapImageUploadError(error)),
  })

  const remove = useMutation({
    mutationFn: (kind: ImageKind) => (kind === 'icon' ? removeServerIcon(serverId) : removeServerCover(serverId)),
    onSuccess: () => refresh(),
    onError: onFailure,
  })

  const values = useMemo(
    () => ({ name: detail?.name ?? '', description: detail?.description ?? '' }),
    [detail?.name, detail?.description],
  )

  function selectImage(kind: ImageKind, file: File) {
    const invalid = validateIconFile(file)
    setError(kind, invalid)
    if (!invalid) upload.mutate({ kind, file })
  }

  function removeImage(kind: ImageKind) {
    setError(kind, undefined)
    remove.mutate(kind)
  }

  const busy = (kind: ImageKind) =>
    (upload.isPending && upload.variables.kind === kind) || (remove.isPending && remove.variables === kind)

  return {
    isLoading: detail === undefined,
    values,
    iconUrl: detail?.iconUrl ?? undefined,
    coverUrl: detail?.coverUrl ?? undefined,
    iconError: errors.icon,
    coverError: errors.cover,
    uploading: { icon: busy('icon'), cover: busy('cover') },
    isSaving: save.isPending,
    onSelectIcon: (file: File) => selectImage('icon', file),
    onRemoveIcon: () => removeImage('icon'),
    onSelectCover: (file: File) => selectImage('cover', file),
    onRemoveCover: () => removeImage('cover'),
    onSave: (next: ServerGeneralValues) => save.mutate(next),
  }
}

export { useServerSettingsGeneralViewModel }
