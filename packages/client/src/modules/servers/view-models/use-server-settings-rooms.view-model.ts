import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { usePresenceStore } from '@/modules/realtime/view-models/stores/presence.store'
import { toRoomItems } from '@/modules/servers/model/mappers/settings-rooms.mapper'
import { moveRoom } from '@/modules/servers/model/rules/move-room'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { serverDetailQueryOptions } from '@/modules/servers/model/services/servers.query'
import { createRoom, deleteRoom, renameRoom, reorderRooms } from '@/modules/servers/model/services/servers.service'

import { useServerSettingsFailureViewModel } from './use-server-settings-failure.view-model'

/** Settings > Rooms: create, rename, reorder and delete. Occupancy comes from the presence store, read only. */
function useServerSettingsRoomsViewModel(serverId: string) {
  const queryClient = useQueryClient()
  const onFailure = useServerSettingsFailureViewModel(serverId)
  const { data: detail } = useQuery(serverDetailQueryOptions(serverId))
  const presenceServerId = usePresenceStore((state) => state.serverId)
  const occupancy = usePresenceStore((state) => state.rooms)
  const [editingRoomId, setEditingRoomId] = useState<string>()

  const rooms = useMemo(
    () => toRoomItems(detail?.rooms ?? [], presenceServerId === serverId ? occupancy : []),
    [detail?.rooms, occupancy, presenceServerId, serverId],
  )

  const refresh = () => queryClient.invalidateQueries({ queryKey: serversKeys.detail(serverId) })

  const create = useMutation({
    mutationFn: (name: string) => createRoom(serverId, name),
    onSuccess: refresh,
    onError: onFailure,
  })
  const rename = useMutation({
    mutationFn: ({ roomId, name }: { roomId: string; name: string }) => renameRoom(serverId, roomId, name),
    onSuccess: async () => {
      setEditingRoomId(undefined)
      await refresh()
    },
    onError: onFailure,
  })
  const remove = useMutation({
    mutationFn: (roomId: string) => deleteRoom(serverId, roomId),
    onSuccess: refresh,
    onError: onFailure,
  })
  const reorder = useMutation({
    mutationFn: (roomIds: string[]) => reorderRooms(serverId, roomIds),
    onSuccess: refresh,
    onError: onFailure,
  })

  return {
    isLoading: detail === undefined,
    rooms,
    roomLimit: detail?.limits.maxRooms ?? 0,
    isCreating: create.isPending,
    editingRoomId,
    onCreate: (name: string) => create.mutate(name),
    onStartRename: (roomId: string) => setEditingRoomId(roomId),
    onRename: (roomId: string, name: string) => rename.mutate({ roomId, name }),
    onRenameCancel: () => setEditingRoomId(undefined),
    onMove: (roomId: string, direction: 'up' | 'down') => {
      const order = moveRoom(
        rooms.map((room) => room.id),
        roomId,
        direction,
      )
      if (order) reorder.mutate(order)
    },
    onDelete: (roomId: string) => remove.mutate(roomId),
  }
}

export { useServerSettingsRoomsViewModel }
