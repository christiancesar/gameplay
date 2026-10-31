import { Outlet } from '@tanstack/react-router'

import { AdminLayoutView } from '@/modules/admin/views/admin-layout.view'
import { useAdminPanelViewModel } from '@/modules/admin/view-models/use-admin-panel.view-model'

export function AdminPanelScreen() {
  const { tab, onTabChange, onBackToHub, ...appearance } = useAdminPanelViewModel()

  return (
    <AdminLayoutView tab={tab} onTabChange={onTabChange} onBackToHub={onBackToHub} {...appearance}>
      <Outlet />
    </AdminLayoutView>
  )
}
