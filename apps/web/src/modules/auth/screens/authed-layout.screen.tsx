import { Outlet } from '@tanstack/react-router'

import { useMonitoringUserViewModel } from '@/modules/auth/view-models/use-monitoring-user.view-model'
import { useAutoReportHardwareViewModel } from '@/modules/hardware/view-models/use-auto-report-hardware.view-model'
import { useRealtimeConnectionViewModel } from '@/modules/realtime/view-models/use-realtime-connection.view-model'
import { UserSettingsScreen } from '@/modules/settings/screens/user-settings.screen'
import { useAccountPreferencesSyncViewModel } from '@/modules/settings/view-models/use-account-preferences-sync.view-model'

export function AuthedLayoutScreen() {
  useMonitoringUserViewModel()
  useRealtimeConnectionViewModel()
  useAccountPreferencesSyncViewModel()
  useAutoReportHardwareViewModel()
  return (
    <>
      <Outlet />
      <UserSettingsScreen />
    </>
  )
}
