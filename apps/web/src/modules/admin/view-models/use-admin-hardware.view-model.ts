import { ADMIN_PAGE_SIZE_MAX } from '@gameplay/contracts'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { toAdminDeviceItem } from '@/modules/admin/model/mappers/admin-device.mapper'
import { EMPTY_HARDWARE_SUMMARY, toHardwareSummary } from '@/modules/admin/model/mappers/hardware-summary.mapper'
import { displayName } from '@/modules/admin/model/mappers/admin-user.mapper'
import {
  adminUserDevicesQueryOptions,
  adminUsersQueryOptions,
  hardwareSummaryQueryOptions,
} from '@/modules/admin/model/services/admin.query'

/**
 * `/admin/hardware`: summary of the base and a table of devices. The API lists devices per user only,
 * so the table reads the devices of every user (up to 100) and merges them, newest report first.
 */
function useAdminHardwareViewModel() {
  const [deviceId, setDeviceId] = useState<string>()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: summary } = useQuery(hardwareSummaryQueryOptions)
  const { data: usersPage } = useQuery(adminUsersQueryOptions({ pageSize: ADMIN_PAGE_SIZE_MAX }))
  const users = usersPage?.users ?? []
  const deviceQueries = useQueries({ queries: users.map((user) => adminUserDevicesQueryOptions(user.id)) })

  const devices = users
    .flatMap((user, index) =>
      (deviceQueries[index]?.data ?? []).map((report) =>
        toAdminDeviceItem(report, { id: user.id, name: displayName(user), avatarUrl: user.image ?? undefined }),
      ),
    )
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))

  const current = devices.find((device) => device.id === deviceId)
  const ofSameUser = current ? devices.filter((device) => device.user.id === current.user.id) : []

  return {
    hardwareTab: {
      summary: summary ? toHardwareSummary(summary) : EMPTY_HARDWARE_SUMMARY,
      devices,
      onOpenDevice: (id: string) => {
        setDeviceId(id)
        setDialogOpen(true)
      },
    },
    deviceDialog: {
      open: dialogOpen && Boolean(current),
      userName: current?.user.name ?? '',
      devices: ofSameUser,
      currentDeviceId: current?.id,
      onDeviceChange: setDeviceId,
      onOpenChange: setDialogOpen,
    },
  }
}

export { useAdminHardwareViewModel }
