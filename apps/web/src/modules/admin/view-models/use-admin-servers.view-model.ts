import { ADMIN_PAGE_SIZE_MAX } from '@gameplay/contracts'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { LimitOverrides } from '@/modules/admin/model/limits.schema'
import { toAdminServerItem, toAdminServerMember } from '@/modules/admin/model/mappers/admin-server.mapper'
import { adminKeys } from '@/modules/admin/model/services/admin.keys'
import {
  adminServerDetailQueryOptions,
  adminServersQueryOptions,
  platformSettingsQueryOptions,
} from '@/modules/admin/model/services/admin.query'
import { deleteAdminServer, setServerLimits } from '@/modules/admin/model/services/admin.service'
import { useLimitOverridesStore } from '@/modules/admin/view-models/stores/limit-overrides.store'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'
import { useDebouncedValue } from '@/modules/admin/view-models/use-debounced-value'
import { SEARCH_DEBOUNCE_MS } from '@/modules/admin/view-models/use-admin-users.view-model'

const MEMBERS_FIELD = 'maxMembers'
const ROOMS_FIELD = 'maxRooms'
/** Used until the settings arrive (the platform defaults). */
const FALLBACK_MEMBERS_LIMIT = 10
const FALLBACK_ROOMS_LIMIT = 2

type ServerDialog = { type: 'members' | 'limits'; serverId: string }

/** `/admin/servers`: owner, members (with who invited them), limits and deletion. */
function useAdminServersViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const onError = useAdminErrorToast()
  const serverOverrides = useLimitOverridesStore((state) => state.servers)
  const setServerOverride = useLimitOverridesStore((state) => state.setServerOverride)

  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<ServerDialog>()
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

  const close = () => setDialog(undefined)

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
    mutationFn: ({ serverId, overrides }: { serverId: string; overrides: LimitOverrides }) =>
      setServerLimits(serverId, {
        maxMembers: overrides[MEMBERS_FIELD] ?? null,
        maxRooms: overrides[ROOMS_FIELD] ?? null,
      }),
    onSuccess: (_, { serverId, overrides }) => {
      setServerOverride(serverId, { maxMembers: overrides[MEMBERS_FIELD], maxRooms: overrides[ROOMS_FIELD] })
      toast.success(t('admin.notices.limitSaved'))
      close()
    },
    onError,
  })

  const serverId = dialog?.serverId ?? ''
  const override = serverOverrides[serverId]
  const dialogOpenChange = (type: ServerDialog['type']) => (next: boolean) => {
    if (!next && dialog?.type === type) close()
  }

  return {
    serversTab: {
      servers: servers.map((server) =>
        toAdminServerItem(server, { defaultMembersLimit, defaultRoomsLimit, override: serverOverrides[server.id] }),
      ),
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
          override: override?.maxMembers,
        },
        {
          id: ROOMS_FIELD,
          label: t('admin.servers.rooms'),
          defaultValue: defaultRoomsLimit,
          override: override?.maxRooms,
        },
      ],
      isSaving: saveLimits.isPending,
      onOpenChange: dialogOpenChange('limits'),
      onSave: (overrides: LimitOverrides) => saveLimits.mutate({ serverId, overrides }),
    },
  }
}

export { MEMBERS_FIELD, ROOMS_FIELD, useAdminServersViewModel }
