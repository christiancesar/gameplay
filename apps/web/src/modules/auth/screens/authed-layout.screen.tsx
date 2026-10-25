import { Outlet } from '@tanstack/react-router'

import { useRealtimeConnectionViewModel } from '@/modules/realtime/view-models/use-realtime-connection.view-model'

export function AuthedLayoutScreen() {
  useRealtimeConnectionViewModel()
  return <Outlet />
}
