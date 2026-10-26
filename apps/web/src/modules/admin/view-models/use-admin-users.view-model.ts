import { ADMIN_PAGE_SIZE_MAX } from '@gameplay/contracts'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { toAdminDeviceItem } from '@/modules/admin/model/mappers/admin-device.mapper'
import { displayName, toAdminSessionItem, toAdminUserItem } from '@/modules/admin/model/mappers/admin-user.mapper'
import { generatePassword } from '@/modules/admin/model/rules/generate-password'
import { adminKeys } from '@/modules/admin/model/services/admin.keys'
import {
  adminUserDevicesQueryOptions,
  adminUserSessionsQueryOptions,
  adminUsersQueryOptions,
  platformSettingsQueryOptions,
} from '@/modules/admin/model/services/admin.query'
import {
  reactivateUser,
  resetUserPassword,
  revokeUserSession,
  revokeUserSessions,
  setUserLimits,
  suspendUser,
} from '@/modules/admin/model/services/admin.service'
import { copyText } from '@/modules/admin/model/services/browser.service'
import type { LimitOverrides } from '@/modules/admin/model/limits.schema'
import type { ResetPasswordValues } from '@/modules/admin/model/reset-password.schema'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'
import { useDebouncedValue } from '@/modules/admin/view-models/use-debounced-value'

const SEARCH_DEBOUNCE_MS = 250
/** The server limit has a single field in the dialog. */
const SERVER_LIMIT_FIELD = 'maxServers'
const DEFAULT_SERVER_LIMIT = 1

type UserDialog = { type: 'sessions' | 'resetPassword' | 'limit' | 'hardware'; userId: string }

/**
 * `/admin/users`: list with presence and sessions, plus the row actions and their dialogs.
 * The list shows up to 100 users (the API maximum); the search narrows it on the server.
 */
function useAdminUsersViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const onError = useAdminErrorToast()

  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<UserDialog>()
  const [suggestedPassword, setSuggestedPassword] = useState('')
  const [deviceId, setDeviceId] = useState<string>()
  const term = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)

  const { data: usersPage } = useQuery({
    ...adminUsersQueryOptions({ search: term || undefined, pageSize: ADMIN_PAGE_SIZE_MAX }),
    placeholderData: keepPreviousData,
  })
  const { data: settings } = useQuery(platformSettingsQueryOptions)
  const users = usersPage?.users ?? []

  const selected = users.find((user) => user.id === dialog?.userId)
  const selectedName = selected ? displayName(selected) : ''
  const sessionsOpen = dialog?.type === 'sessions'
  const { data: sessions } = useQuery({
    ...adminUserSessionsQueryOptions(dialog?.userId ?? ''),
    enabled: sessionsOpen,
  })
  const hardwareOpen = dialog?.type === 'hardware'
  const { data: devices } = useQuery({
    ...adminUserDevicesQueryOptions(dialog?.userId ?? ''),
    enabled: hardwareOpen,
  })

  const defaultServerLimit = settings?.maxServersPerUser ?? DEFAULT_SERVER_LIMIT
  const items = users.map(toAdminUserItem)

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() })
  const refreshSessions = (userId: string) =>
    queryClient.invalidateQueries({ queryKey: adminKeys.userSessions(userId) })
  const close = () => setDialog(undefined)

  const suspend = useMutation({
    mutationFn: suspendUser,
    onSuccess: async () => {
      toast.success(t('admin.notices.suspended'))
      await Promise.all([refreshUsers(), queryClient.invalidateQueries({ queryKey: adminKeys.userSessionsAll() })])
    },
    onError,
  })
  const reactivate = useMutation({
    mutationFn: reactivateUser,
    onSuccess: async () => {
      toast.success(t('admin.notices.reactivated'))
      await refreshUsers()
    },
    onError,
  })
  const endSessions = useMutation({
    mutationFn: revokeUserSessions,
    onSuccess: async (_, userId) => {
      toast.success(t('admin.notices.sessionsEnded'))
      await Promise.all([refreshUsers(), refreshSessions(userId)])
    },
    onError,
  })
  const endSession = useMutation({
    mutationFn: ({ userId, sessionId }: { userId: string; sessionId: string }) => revokeUserSession(userId, sessionId),
    onSuccess: async (_, { userId }) => {
      toast.success(t('admin.notices.sessionEnded'))
      await Promise.all([refreshUsers(), refreshSessions(userId)])
    },
    onError,
  })
  const resetPassword = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) => resetUserPassword(userId, password),
    onSuccess: async (_, { userId }) => {
      toast.success(t('admin.notices.passwordReset'))
      close()
      await refreshSessions(userId)
    },
    onError,
  })
  const saveLimit = useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: number | undefined }) =>
      setUserLimits(userId, { maxServers: value ?? null }),
    onSuccess: async () => {
      toast.success(t('admin.notices.limitSaved'))
      close()
      await refreshUsers()
    },
    onError,
  })

  const open = (type: UserDialog['type']) => (userId: string) => {
    if (type === 'resetPassword') setSuggestedPassword(generatePassword())
    if (type === 'hardware') setDeviceId(undefined)
    setDialog({ type, userId })
  }
  const dialogOpenChange = (type: UserDialog['type']) => (next: boolean) => {
    if (!next && dialog?.type === type) close()
  }

  const userId = dialog?.userId ?? ''
  const override = selected?.maxServersOverride ?? undefined

  return {
    usersTab: {
      users: items,
      search,
      onSearchChange: setSearch,
      onViewSessions: open('sessions'),
      onViewHardware: open('hardware'),
      onSuspend: (id: string) => suspend.mutate(id),
      onReactivate: (id: string) => reactivate.mutate(id),
      onEndSessions: (id: string) => endSessions.mutate(id),
      onResetPassword: open('resetPassword'),
      onEditLimit: open('limit'),
    },
    sessionsDialog: {
      open: sessionsOpen,
      userName: selectedName,
      sessions: (sessions ?? []).map(toAdminSessionItem),
      onOpenChange: dialogOpenChange('sessions'),
      onEndSession: (sessionId: string) => endSession.mutate({ userId, sessionId }),
    },
    resetPasswordDialog: {
      open: dialog?.type === 'resetPassword',
      userName: selectedName,
      initialPassword: suggestedPassword,
      isSubmitting: resetPassword.isPending,
      onOpenChange: dialogOpenChange('resetPassword'),
      onGenerate: generatePassword,
      onCopy: (password: string) => void copyText(password).then(() => toast.success(t('common.copied'))),
      onSubmit: (values: ResetPasswordValues) => resetPassword.mutate({ userId, password: values.password }),
    },
    limitDialog: {
      open: dialog?.type === 'limit',
      title: t('admin.users.limitTitle', { name: selectedName }),
      fields: [
        { id: SERVER_LIMIT_FIELD, label: t('admin.users.serverLimit'), defaultValue: defaultServerLimit, override },
      ],
      isSaving: saveLimit.isPending,
      onOpenChange: dialogOpenChange('limit'),
      onSave: (overrides: LimitOverrides) => saveLimit.mutate({ userId, value: overrides[SERVER_LIMIT_FIELD] }),
    },
    hardwareDialog: {
      open: hardwareOpen,
      userName: selectedName,
      devices: selected
        ? (devices ?? []).map((report) =>
            toAdminDeviceItem(report, { id: selected.id, name: selectedName, avatarUrl: selected.image ?? undefined }),
          )
        : [],
      currentDeviceId: deviceId,
      onDeviceChange: setDeviceId,
      onOpenChange: dialogOpenChange('hardware'),
    },
  }
}

export { SEARCH_DEBOUNCE_MS, SERVER_LIMIT_FIELD, useAdminUsersViewModel }
