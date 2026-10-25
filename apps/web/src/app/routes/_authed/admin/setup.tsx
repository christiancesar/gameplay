import { createFileRoute } from '@tanstack/react-router'

import { AdminTwoFactorSetupScreen } from '@/modules/admin/screens/admin-two-factor-setup.screen'

export const Route = createFileRoute('/_authed/admin/setup')({
  component: AdminTwoFactorSetupScreen,
})
