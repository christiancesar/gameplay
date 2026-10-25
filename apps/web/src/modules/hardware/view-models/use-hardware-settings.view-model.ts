import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { DeviceReport } from '@gameplay/contracts'

import { toDeviceHardware } from '@/modules/hardware/model/mappers/device-report.mapper'
import { toManualDefaults, toManualRequest } from '@/modules/hardware/model/mappers/manual-hardware.mapper'
import type { ManualHardware } from '@/modules/hardware/model/manual-hardware.schema'
import { deviceReporter } from '@/modules/hardware/model/services/device-reporter.service'
import { displays, type DisplaysPermission } from '@/modules/hardware/model/services/displays.service'
import { hardwareKeys } from '@/modules/hardware/model/services/hardware.keys'
import { devicesQueryOptions } from '@/modules/hardware/model/services/hardware.query'
import { saveManualHardware } from '@/modules/hardware/model/services/hardware.service'

/** Puts a report in the cached list, replacing the one of the same device. */
function upsertReport(list: DeviceReport[] | undefined, report: DeviceReport): DeviceReport[] {
  return [report, ...(list ?? []).filter((device) => device.deviceId !== report.deviceId)]
}

/** Settings > Hardware: this device's report, collecting again, the monitors permission and the manual form. */
function useHardwareSettingsViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: devices, isSuccess } = useQuery(devicesQueryOptions)
  const [deviceId] = useState(() => deviceReporter.deviceId())
  const [displaysPermission, setDisplaysPermission] = useState<DisplaysPermission>('unsupported')

  const report = devices?.find((device) => device.deviceId === deviceId)

  const store = (saved: DeviceReport) =>
    queryClient.setQueryData<DeviceReport[]>(hardwareKeys.devices(), (list) => upsertReport(list, saved))

  const collect = useMutation({
    mutationFn: (withDisplays: boolean) => deviceReporter.report({ withDisplays }),
    onSuccess: store,
    onError: () => toast.error(t('hardware.errors.collect')),
  })
  const saveManual = useMutation({
    mutationFn: (values: ManualHardware) => saveManualHardware(deviceId, toManualRequest(values)),
    onSuccess: store,
    onError: () => toast.error(t('hardware.errors.saveManual')),
  })

  useEffect(() => {
    void displays.permission().then(setDisplaysPermission)
  }, [])

  // The login report may have failed or not run yet: the section always has something to show.
  const autoCollected = useRef(false)
  const { mutate: collectNow } = collect
  useEffect(() => {
    if (!isSuccess || report || autoCollected.current) return
    autoCollected.current = true
    collectNow(false)
  }, [isSuccess, report, collectNow])

  return {
    hardware: report ? toDeviceHardware(report) : undefined,
    displaysPermission,
    lastSentAt: report?.collectedAt,
    isCollecting: collect.isPending,
    defaultManual: toManualDefaults(report?.manual ?? null),
    isSavingManual: saveManual.isPending,
    manualSaved: saveManual.isSuccess,
    onRefresh: () => collect.mutate(displaysPermission === 'granted'),
    onAllowDisplays: async () => {
      const result = await displays.request()
      setDisplaysPermission(result)
      if (result === 'granted') collect.mutate(true)
    },
    onSaveManual: (values: ManualHardware) => saveManual.mutate(values),
  }
}

export { useHardwareSettingsViewModel }
