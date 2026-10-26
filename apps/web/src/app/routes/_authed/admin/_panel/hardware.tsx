import { createFileRoute } from '@tanstack/react-router'

import { AdminHardwareScreen } from '@/modules/admin/screens/admin-hardware.screen'

export const Route = createFileRoute('/_authed/admin/_panel/hardware')({
  component: AdminHardwareScreen,
})
