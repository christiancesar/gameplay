import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { useServerSubscriptionViewModel } from '@/modules/realtime/view-models/use-server-subscription.view-model'
import { useWatchSelectionViewModel } from '@/modules/screen-share/view-models/use-watch-selection.view-model'
import { toStageParticipants } from '@/modules/rooms/model/mappers/stage-participants.mapper'
import { useVoiceRoomViewModel } from '@/modules/rooms/view-models/use-voice-room.view-model'
import { memberName, toPresenceMembers } from '@/modules/servers/model/mappers/presence-members.mapper'
import { toSidebarRooms } from '@/modules/servers/model/mappers/sidebar-rooms.mapper'
import { toSwitcherServers } from '@/modules/servers/model/mappers/switcher-server.mapper'
import { connectedRoomName } from '@/modules/servers/model/rules/connected-room-name'
import { isServerUnavailable } from '@/modules/servers/model/rules/is-server-unavailable'
import { needsSwitchConfirmation } from '@/modules/servers/model/rules/needs-switch-confirmation'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import {
  serverDetailQueryOptions,
  serverMembersQueryOptions,
  serversListQueryOptions,
} from '@/modules/servers/model/services/servers.query'
import { leaveServer } from '@/modules/servers/model/services/servers.service'

const SERVER_ROUTE = '/_authed/servers/$serverId'
const UNAVAILABLE_TOAST_ID = 'server-unavailable'

// `roomId` is set when the switch comes from clicking a room of this server while connected to another one.
type PendingSwitch = { targetId: string; roomId?: string; serverName: string; roomName: string }

/** Server screen (F6): detail, role, rooms, live presence, members, server switcher and leaving. */
function useServerScreenViewModel() {
  const { t } = useTranslation()
  const { serverId } = useParams({ from: SERVER_ROUTE })
  const { watch: watchId } = useSearch({ from: SERVER_ROUTE })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const voice = useVoiceRoomViewModel()
  const { connection } = voice

  const { data: session } = useQuery(sessionQueryOptions)
  const { data: servers } = useQuery(serversListQueryOptions)
  const detailQuery = useQuery(serverDetailQueryOptions(serverId))
  const detail = detailQuery.data
  const { data: members } = useQuery({ ...serverMembersQueryOptions(serverId), enabled: detail !== undefined })
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
      if (connection?.serverId === serverId) voice.leaveRoom()
      await navigate({ to: '/', replace: true })
      queryClient.removeQueries({ queryKey: serversKeys.detail(serverId) })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: serversKeys.list() }),
        queryClient.invalidateQueries({ queryKey: serversKeys.myLimits() }),
      ])
    },
    onError: () => {
      toast.error(t('server.leaveFailed'))
    },
  })

  const memberList = useMemo(() => members ?? [], [members])
  const sidebarRooms = useMemo(
    () => toSidebarRooms(detail?.rooms ?? [], occupancy, memberList, voice.speaking),
    [detail?.rooms, occupancy, memberList, voice.speaking],
  )
  const presenceMembers = useMemo(() => toPresenceMembers(memberList, onlineUserIds), [memberList, onlineUserIds])
  const switcherServers = useMemo(() => toSwitcherServers(servers ?? []), [servers])

  function openServer(targetId: string) {
    void navigate({ to: '/servers/$serverId', params: { serverId: targetId } })
  }

  function askToSwitch(targetId: string, roomId?: string) {
    // The connected room may belong to another server than the one on screen (the user went through the Hub).
    const connectedRooms =
      connection?.serverId === serverId
        ? detail?.rooms
        : queryClient.getQueryData(serverDetailQueryOptions(connection?.serverId ?? '').queryKey)?.rooms
    setPendingSwitch({
      targetId,
      roomId,
      serverName: switcherServers.find((server) => server.id === targetId)?.name ?? '',
      roomName: connectedRoomName(connection, connectedRooms),
    })
  }

  function onSelectServer(targetId: string) {
    if (!needsSwitchConfirmation(connection, targetId)) {
      openServer(targetId)
      return
    }
    askToSwitch(targetId)
  }

  function onSelectRoom(roomId: string) {
    // Connected on another server (reached through the Hub): one connection at a time, so ask first.
    if (needsSwitchConfirmation(connection, serverId)) {
      askToSwitch(serverId, roomId)
      return
    }
    void voice.joinRoom(serverId, roomId)
  }

  const user = session?.user

  const onThisServer = connection?.serverId === serverId
  const stageParticipants = useMemo(
    () =>
      toStageParticipants({
        participants: voice.participants,
        members: memberList,
        selfId: user?.id,
        peers: voice.peers,
        speaking: voice.speaking,
        volumes: voice.volumes,
      }),
    [voice.participants, memberList, user?.id, voice.peers, voice.speaking, voice.volumes],
  )
  const liveStreams = useMemo(
    () => stageParticipants.filter((participant) => participant.isLive && !participant.isMe),
    [stageParticipants],
  )
  const viewerProfiles = useMemo(
    () =>
      Object.fromEntries(
        memberList.map((member) => [
          member.user.id,
          { name: memberName(member), avatarUrl: member.user.image ?? undefined },
        ]),
      ),
    [memberList],
  )

  // `?watch=` is the source of truth of what is watched; the session follows it.
  const setWatch = useCallback(
    (next: string | undefined) =>
      void navigate({ to: '.', search: (prev) => ({ ...prev, watch: next }), replace: next === undefined }),
    [navigate],
  )
  const closeWatch = useCallback(() => setWatch(undefined), [setWatch])
  useWatchSelectionViewModel({
    watchId,
    // Members give the names; judging who is live before they arrive would close the view for nothing.
    ready: onThisServer && voice.status === 'connected' && members !== undefined,
    inCall: onThisServer,
    liveIds: liveStreams.map((participant) => participant.id),
    onClose: closeWatch,
  })
  const watched = watchId ? liveStreams.find((participant) => participant.id === watchId) : undefined

  return {
    viewerProfiles,
    isLoading: detail === undefined,
    sidebar: {
      server: { name: detail?.name ?? '', iconUrl: detail?.iconUrl ?? undefined },
      servers: switcherServers,
      currentServerId: serverId,
      role: detail?.role ?? 'member',
      pendingRequests: detail?.pendingJoinRequests ?? 0,
      rooms: sidebarRooms,
      currentRoomId: connection?.serverId === serverId ? connection.roomId : undefined,
      pendingSwitch: pendingSwitch && { serverName: pendingSwitch.serverName, roomName: pendingSwitch.roomName },
      onSelectRoom,
      onBackToHub: () => void navigate({ to: '/' }),
      onSelectServer,
      onConfirmSwitch: () => {
        if (!pendingSwitch) return
        if (pendingSwitch.roomId) {
          // Joining a room leaves the current one first (VoiceSession switches rooms).
          void voice.joinRoom(pendingSwitch.targetId, pendingSwitch.roomId)
        } else {
          voice.leaveRoom()
          openServer(pendingSwitch.targetId)
        }
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
      isMuted: voice.isMuted,
      isDeafened: voice.isDeafened,
      // Only the profile opens; server settings and watch are left out of the URL.
      onOpenSettings: () => void navigate({ to: '.', search: { settings: 'profile' as const } }),
      onToggleMute: voice.toggleMute,
      onToggleDeafen: voice.toggleDeafen,
      onLeaveRoom: voice.leaveRoom,
    },
    // The stage shows the call only on the server it belongs to.
    stage: onThisServer
      ? {
          roomName: connectedRoomName(connection, detail?.rooms),
          micDenied: voice.micDenied,
          participants: stageParticipants,
          onWatch: setWatch,
          onVolumeChange: voice.setVolume,
        }
      : null,
    // The screen being watched replaces the stage while it lasts.
    watch:
      onThisServer && watched
        ? {
            streamerName: watched.name,
            liveStreams: liveStreams.map(({ id, name }) => ({ id, name })),
            currentStreamId: watched.id,
            participants: stageParticipants,
            onSwitchStream: setWatch,
            onStopWatching: closeWatch,
            onWatch: setWatch,
            onVolumeChange: voice.setVolume,
          }
        : null,
  }
}

export { useServerScreenViewModel }
