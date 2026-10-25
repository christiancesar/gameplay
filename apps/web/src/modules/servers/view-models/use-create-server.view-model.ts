import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { mapCreateServerError } from '@/modules/servers/model/mappers/create-server-error.mapper'
import { validateIconFile } from '@/modules/servers/model/rules/validate-icon-file'
import type { CreateServerValues } from '@/modules/servers/model/server.schema'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { serversListQueryOptions } from '@/modules/servers/model/services/servers.query'
import { createServer, uploadServerIcon } from '@/modules/servers/model/services/servers.service'
import { useServerLimitStore } from '@/modules/servers/view-models/stores/server-limit.store'
import { ApiError } from '@/shared/lib/api-error'
import type { ImageError } from '@/shared/ui/image-picker'

type SelectedIcon = { file: File; previewUrl: string }

/** Create-server dialog: name, optional icon, then opens the new server. */
function useCreateServerViewModel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: servers } = useQuery(serversListQueryOptions)
  const markRefused = useServerLimitStore((state) => state.markRefused)

  const [open, setOpen] = useState(false)
  const [icon, setIcon] = useState<SelectedIcon>()
  const [iconError, setIconError] = useState<ImageError>()

  // Object URLs hold the file in memory until revoked.
  useEffect(() => {
    if (!icon) return
    return () => URL.revokeObjectURL(icon.previewUrl)
  }, [icon])

  const mutation = useMutation({
    mutationFn: async (values: CreateServerValues) => {
      const server = await createServer({ name: values.name, defaultRoomName: t('hub.defaultRoomName') })
      if (icon) {
        // The server exists already: a failed icon upload must not stop the user from reaching it.
        await uploadServerIcon(server.id, icon.file).catch(() => undefined)
      }
      return server
    },
    onSuccess: async (server) => {
      await queryClient.invalidateQueries({ queryKey: serversKeys.list() })
      close()
      await navigate({ to: '/servers/$serverId', params: { serverId: server.id } })
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === 'SERVER_LIMIT_REACHED') {
        markRefused((servers ?? []).filter((server) => server.role === 'owner').length)
        await queryClient.invalidateQueries({ queryKey: serversKeys.list() })
      }
    },
  })
  const { reset } = mutation

  function close() {
    setOpen(false)
    setIcon(undefined)
    setIconError(undefined)
    reset()
  }

  const onSelectIcon = useCallback((file: File) => {
    const error = validateIconFile(file)
    setIconError(error)
    if (error) return
    setIcon({ file, previewUrl: URL.createObjectURL(file) })
  }, [])

  const onRemoveIcon = useCallback(() => {
    setIcon(undefined)
    setIconError(undefined)
  }, [])

  return {
    open,
    iconPreviewUrl: icon?.previewUrl,
    iconError,
    formError: mutation.error ? mapCreateServerError(mutation.error) : undefined,
    isSubmitting: mutation.isPending,
    openDialog: () => setOpen(true),
    onOpenChange: (next: boolean) => (next ? setOpen(true) : close()),
    onSelectIcon,
    onRemoveIcon,
    onSubmit: (values: CreateServerValues) => mutation.mutate(values),
  }
}

export { useCreateServerViewModel }
