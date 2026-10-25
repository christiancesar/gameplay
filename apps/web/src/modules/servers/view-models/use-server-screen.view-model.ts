import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { useServerSubscriptionViewModel } from '@/modules/realtime/view-models/use-server-subscription.view-model'
import { useVoiceStore } from '@/modules/rooms/view-models/stores/voice.store'
import { toPresenceMembers } from '@/modules/servers/model/mappers/presence-members.mapper'
import { toSidebarRooms } from '@/modules/servers/model/mappers/sidebar-rooms.mapper'
import { toSwitcherServers } from '@/modules/servers/model/mappers/switcher-server.mapper'
import { connectedRoomName } from '@/modules/servers/model/rules/connected-room-name'
import { isServerUnavailable } from '@/modules/servers/model/rules/is-server-unavailable'
import { needsSwitchConfirmation } from '@/modules/servers/model/rules/needs-switch-confirmation'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import {
  serverDetailQueryOptions,
  serverJoinRequestsQueryOptions,
  serverMembersQueryOptions,
  serversListQueryOptions,
} from '@/modules/servers/model/services/servers.query'
import { leaveServer } from '@/modules/servers/model/services/servers.service'

const UNAVAILABLE_TOAST_ID = 'server-unavailable'

type PendingSwitch = { targetId: string; serverName: string; roomName: string }

/** Server screen (F6): detail, role, rooms, live presence, members, server switcher and leaving. */
function useServerScreenViewModel() {
  const { t } = useTranslation()
  const { serverId } = useParams({ from: '/_authed/servers/$serverId' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const connection = useVoiceStore((state) => state.connection)
  const setConnection = useVoiceStore((state) => state.setConnection)

  const { data: session } = useQuery(sessionQueryOptions)
  const { data: servers } = useQuery(serversListQueryOptions)
  const detailQuery = useQuery(serverDetailQueryOptions(serverId))
  const detail = detailQuery.data
  const canManage = detail !== undefined && detail.role !== 'member'
  const { data: members } = useQuery({ ...serverMembersQueryOptions(serverId), enabled: detail !== undefined })
  const { data: joinRequests } = useQuery({ ...serverJoinRequestsQueryOptions(serverId), enabled: canManage })
  const { onlineUserIds, rooms: occupancy } = useServerSubscriptionViewModel(serverId)

  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch>()

  // Not a member (403) or deleted (404): nothing to show here.
  useEffect(() => {
    if (!isServerUnavailable(detailQuery.error)) return
    toast.error(t('server.unavailable'), { id: UNAVAILABLE_TOAST_ID })
    void navigate({ to: '/', replace: true })
  }, [detailQuery.error, navigate, t])

  const leave = useMutation({
    mutationFn: () => leaveServer(serverId),
    onSuccess: async () => {
      if (connection?.serverId === serverId) setConnection(null)
      await navigate({ to: '/', replace: true })
      queryClient.removeQueries({ queryKey: serversKeys.detail(serverId) })
      await queryClient.invalidateQueries({ queryKey: serversKeys.list() })
    },
    onError: () => {
      toast.error(t('server.leaveFailed'))
    },
  })

  const memberList = useMemo(() => members ?? [], [members])
  const sidebarRooms = useMemo(
    () => toSidebarRooms(detail?.rooms ?? [], occupancy, memberList),
    [detail?.rooms, occupancy, memberList],
  )
  const presenceMembers = useMemo(() => toPresenceMembers(memberList, onlineUserIds), [memberList, onlineUserIds])
  const switcherServers = useMemo(() => toSwitcherServers(servers ?? []), [servers])

  function openServer(targetId: string) {
    void navigate({ to: '/servers/$serverId', params: { serverId: targetId } })
  }

  function onSelectServer(targetId: string) {
    if (!needsSwitchConfirmation(connection, targetId)) {
      openServer(targetId)
      return
    }
    // The connected room may belong to another server than the one on screen (the user went through the Hub).
    const connectedRooms =
      connection?.serverId === serverId
        ? detail?.rooms
        : queryClient.getQueryData(serverDetailQueryOptions(connection?.serverId ?? '').queryKey)?.rooms
    setPendingSwitch({
      targetId,
      serverName: switcherServers.find((server) => server.id === targetId)?.name ?? '',
      roomName: connectedRoomName(connection, connectedRooms),
    })
  }

  const user = session?.user

  return {
    isLoading: detail === undefined,
    sidebar: {
      server: { name: detail?.name ?? '', iconUrl: detail?.iconUrl ?? undefined },
      servers: switcherServers,
      currentServerId: serverId,
      role: detail?.role ?? 'member',
      pendingRequests: canManage ? (joinRequests?.length ?? 0) : 0,
      rooms: sidebarRooms,
      // Voice (FE-09) fills the connection; until then no room is ever current.
      currentRoomId: connection?.serverId === serverId ? connection.roomId : undefined,
      pendingSwitch: pendingSwitch && { serverName: pendingSwitch.serverName, roomName: pendingSwitch.roomName },
      // Joining a room is FE-09: clicking one does nothing yet.
      onSelectRoom: () => undefined,
      onBackToHub: () => void navigate({ to: '/' }),
      onSelectServer,
      onConfirmSwitch: () => {
        if (!pendingSwitch) return
        setConnection(null)
        openServer(pendingSwitch.targetId)
        setPendingSwitch(undefined)
      },
      onDismissSwitch: () => setPendingSwitch(undefined),
      onOpenServerSettings: () =>
        void navigate({ to: '.', search: (prev) => ({ ...prev, serverSettings: 'general' as const }) }),
      onLeaveServer: () => leave.mutate(),
    },
    members: presenceMembers,
    userCard: {
      user: { name: user?.name ?? '', email: user?.email ?? '', avatarUrl: user?.image ?? undefined },
      inRoom: connection !== null,
      // Mute and deafen come with the voice ticket (FE-09).
      isMuted: false,
      isDeafened: false,
      // Only the profile opens; server settings and watch are left out of the URL.
      onOpenSettings: () => void navigate({ to: '.', search: { settings: 'profile' as const } }),
      onToggleMute: () => undefined,
      onToggleDeafen: () => undefined,
      onLeaveRoom: () => setConnection(null),
    },
  }
}

export { useServerScreenViewModel }
