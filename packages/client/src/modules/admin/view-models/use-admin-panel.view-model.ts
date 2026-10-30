import { useCallback } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'

import { ADMIN_TABS, type AdminTab } from '@/modules/admin/model/admin-tab.constants'

const DEFAULT_TAB: AdminTab = 'users'

function tabFromPathname(pathname: string): AdminTab {
  const segment = pathname.split('/')[2]
  return ADMIN_TABS.find((tab) => tab === segment) ?? DEFAULT_TAB
}

export function useAdminPanelViewModel() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const navigate = useNavigate()

  const tab = tabFromPathname(pathname)
  const onTabChange = useCallback((next: AdminTab) => void navigate({ to: `/admin/${next}` }), [navigate])
  const onBackToHub = useCallback(() => void navigate({ to: '/hub' }), [navigate])

  return { tab, onTabChange, onBackToHub }
}
