import {
  ADMIN_PAGE_SIZE_MAX,
  type MediaNotice,
  type MediaResource,
  type ServerMediaOverrides,
} from '@gameplay/contracts'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { LimitOverrides } from '@/modules/admin/model/limits.schema'
import { toAdminServerItem, toAdminServerMember } from '@/modules/admin/model/mappers/admin-server.mapper'
import { adminKeys } from '@/modules/admin/model/services/admin.keys'
import { fromMediaChoices, toMediaChoices } from '@/modules/admin/model/mappers/media-choice.mapper'
import type { MediaChoice } from '@/modules/admin/model/media-choice.schema'
import { effectiveMedia, mediaGoingOff } from '@/modules/admin/model/rules/media-going-off'
import {
  adminMediaQueryOptions,
  adminServerDetailQueryOptions,
  adminServersQueryOptions,
  platformSettingsQueryOptions,
  serverMediaOverridesQueryOptions,
} from '@/modules/admin/model/services/admin.query'
import { deleteAdminServer, setServerLimits, updateServerMedia } from '@/modules/admin/model/services/admin.service'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'
import { useDebouncedValue } from '@/modules/admin/view-models/use-debounced-value'
import { useMediaOffConfirm } from '@/modules/admin/view-models/use-media-off-confirm'
import { SEARCH_DEBOUNCE_MS } from '@/modules/admin/view-models/use-admin-users.view-model'

const MEMBERS_FIELD = 'maxMembers'
const ROOMS_FIELD = 'maxRooms'
/** Used until the settings arrive (the platform defaults). */
const FALLBACK_MEMBERS_LIMIT = 10
const FALLBACK_ROOMS_LIMIT = 2

type ServerDialog = { type: 'members' | 'limits'; serverId: string }

type SaveInput = { serverId: string; overrides: LimitOverrides; media?: ServerMediaOverrides; notice?: MediaNotice }

/** `/admin/servers`: owner, members (with who invited them), limits and deletion. */
function useAdminServersViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const onError = useAdminErrorToast()

  const navigate = useNavigate()
  // From the Media tab: open "Adjust server" for that server.
  const { edit } = useSearch({ from: '/_authed/admin/_panel/servers' })
  const [search, setSearch] = useState('')
  const [picked, setDialog] = useState<ServerDialog>()
  const dialog: ServerDialog | undefined = picked ?? (edit ? { type: 'limits', serverId: edit } : undefined)
  const term = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)

  const { data: page } = useQuery({
    ...adminServersQueryOptions({ search: term || undefined, pageSize: ADMIN_PAGE_SIZE_MAX }),
    placeholderData: keepPreviousData,
  })
  const { data: settings } = useQuery(platformSettingsQueryOptions)
  const servers = page?.servers ?? []
  const defaultMembersLimit = settings?.maxMembersPerServer ?? FALLBACK_MEMBERS_LIMIT
  const defaultRoomsLimit = settings?.maxRoomsPerServer ?? FALLBACK_ROOMS_LIMIT

  const selected = servers.find((server) => server.id === dialog?.serverId)
  const { data: detail } = useQuery({
    ...adminServerDetailQueryOptions(dialog?.serverId ?? ''),
    enabled: dialog?.type === 'members',
  })

  const { data: media } = useQuery({ ...adminMediaQueryOptions, enabled: dialog?.type === 'limits' })
  const { data: mediaOverrides } = useQuery({
    ...serverMediaOverridesQueryOptions(dialog?.serverId ?? ''),
    enabled: dialog?.type === 'limits',
  })

  const close = () => {
    setDialog(undefined)
    if (edit) void navigate({ to: '/admin/servers', search: {}, replace: true })
  }

  const remove = useMutation({
    mutationFn: deleteAdminServer,
    onSuccess: async () => {
      toast.success(t('admin.notices.serverDeleted'))
      // The owners' server counts on the users tab change too.
      await queryClient.invalidateQueries({ queryKey: adminKeys.serversAll() })
    },
    onError,
  })
  const saveLimits = useMutation({
    mutationFn: async ({ serverId, overrides, media: overridesMedia, notice }: SaveInput) => {
      await setServerLimits(serverId, {
        maxMembers: overrides[MEMBERS_FIELD] ?? null,
        maxRooms: overrides[ROOMS_FIELD] ?? null,
      })
      return overridesMedia ? updateServerMedia(serverId, { overrides: overridesMedia, notice }) : 0
    },
    onSuccess: async (notified) => {
      toast.success(t('admin.notices.limitSaved'))
      if (notified > 0) toast.success(t('admin.announcements.sent', { count: notified }))
      confirm.close()
      close()
      await queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
    onError,
  })
  const confirm = useMediaOffConfirm(dialog?.serverId ?? null, saveLimits.isPending)

  const serverId = dialog?.serverId ?? ''
  const dialogOpenChange = (type: ServerDialog['type']) => (next: boolean) => {
    if (!next && dialog?.type === type) close()
  }

  return {
    serversTab: {
      servers: servers.map(toAdminServerItem),
      search,
      onSearchChange: setSearch,
      onViewMembers: (id: string) => setDialog({ type: 'members', serverId: id }),
      onEditLimits: (id: string) => setDialog({ type: 'limits', serverId: id }),
      onDelete: (id: string) => remove.mutate(id),
    },
    membersDialog: {
      open: dialog?.type === 'members',
      serverName: selected?.name ?? '',
      members: (detail?.members ?? []).map(toAdminServerMember),
      onOpenChange: dialogOpenChange('members'),
    },
    limitDialog: {
      open: dialog?.type === 'limits',
      title: t('admin.servers.limitsTitle', { name: selected?.name ?? '' }),
      fields: [
        {
          id: MEMBERS_FIELD,
          label: t('admin.servers.members'),
          defaultValue: defaultMembersLimit,
          override: selected?.maxMembersOverride ?? undefined,
        },
        {
          id: ROOMS_FIELD,
          label: t('admin.servers.rooms'),
          defaultValue: defaultRoomsLimit,
          override: selected?.maxRoomsOverride ?? undefined,
        },
      ],
      media: media && mediaOverrides ? { globals: media.settings, choices: toMediaChoices(mediaOverrides) } : undefined,
      isSaving: saveLimits.isPending,
      onOpenChange: dialogOpenChange('limits'),
      onSave: (overrides: LimitOverrides, choices?: Record<MediaResource, MediaChoice>) => {
        const next = choices && fromMediaChoices(choices)
        const goingOff =
          media && mediaOverrides && next
            ? mediaGoingOff(effectiveMedia(media.settings, mediaOverrides), effectiveMedia(media.settings, next))
            : []
        confirm.request(goingOff, (notice) => saveLimits.mutate({ serverId, overrides, media: next, notice }))
      },
    },
    confirmDialog: confirm.dialog,
  }
}

export { MEMBERS_FIELD, ROOMS_FIELD, useAdminServersViewModel }
