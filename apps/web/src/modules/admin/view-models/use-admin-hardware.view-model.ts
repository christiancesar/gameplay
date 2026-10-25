import { ADMIN_PAGE_SIZE_MAX } from '@gameplay/contracts'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { toAdminDeviceListItem } from '@/modules/admin/model/mappers/admin-device.mapper'
import { EMPTY_HARDWARE_SUMMARY, toHardwareSummary } from '@/modules/admin/model/mappers/hardware-summary.mapper'
import { adminDevicesQueryOptions, hardwareSummaryQueryOptions } from '@/modules/admin/model/services/admin.query'

/**
 * `/admin/hardware`: summary of the base and a table of devices, newest report first. The table shows
 * the first page of `GET /admin/hardware/devices` (up to 100); the Hardware View has no pagination or search yet.
 */
function useAdminHardwareViewModel() {
  const [deviceId, setDeviceId] = useState<string>()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: summary } = useQuery(hardwareSummaryQueryOptions)
  const { data: page } = useQuery({
    ...adminDevicesQueryOptions({ pageSize: ADMIN_PAGE_SIZE_MAX }),
    placeholderData: keepPreviousData,
  })
  const devices = (page?.devices ?? []).map(toAdminDeviceListItem)

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
