import { useAdminHardwareViewModel } from '@/modules/admin/view-models/use-admin-hardware.view-model'
import { DeviceHardwareDialogView } from '@/modules/admin/views/device-hardware-dialog.view'
import { HardwareTabView } from '@/modules/admin/views/hardware-tab.view'

export function AdminHardwareScreen() {
  const { hardwareTab, deviceDialog } = useAdminHardwareViewModel()

  return (
    <>
      <HardwareTabView {...hardwareTab} />
      <DeviceHardwareDialogView {...deviceDialog} />
    </>
  )
}
