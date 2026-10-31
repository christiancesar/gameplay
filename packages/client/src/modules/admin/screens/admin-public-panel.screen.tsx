import { Outlet } from '@tanstack/react-router'

import { useAdminPublicPanelViewModel } from '@/modules/admin/view-models/use-admin-public-panel.view-model'
import { PublicAdminLayoutView } from '@/modules/admin/views/public-admin-layout.view'

function AdminPublicPanelScreen() {
  const { tab, onTabChange } = useAdminPublicPanelViewModel()
  return (
    <PublicAdminLayoutView tab={tab} onTabChange={onTabChange}>
      <Outlet />
    </PublicAdminLayoutView>
  )
}

export { AdminPublicPanelScreen }
