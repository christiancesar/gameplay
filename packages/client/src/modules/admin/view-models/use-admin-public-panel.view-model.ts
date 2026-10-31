import { useLocation, useNavigate } from '@tanstack/react-router'

import { PUBLIC_ADMIN_TABS, type PublicAdminTab } from '@/modules/admin/model/public-admin.constants'

function useAdminPublicPanelViewModel() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const navigate = useNavigate()
  const segment = pathname.split('/')[3] as PublicAdminTab | undefined
  const tab = PUBLIC_ADMIN_TABS.includes(segment ?? 'roadmap') ? (segment ?? 'roadmap') : 'roadmap'

  return {
    tab,
    onTabChange: (next: PublicAdminTab) => void navigate({ to: `/admin/public/${next}` }),
  }
}

export { useAdminPublicPanelViewModel }
