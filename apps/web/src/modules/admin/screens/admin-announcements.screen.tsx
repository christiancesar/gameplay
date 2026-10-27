import { useAdminAnnouncementsViewModel } from '@/modules/admin/view-models/use-admin-announcements.view-model'
import { AnnouncementsTabView } from '@/modules/admin/views/announcements-tab.view'

export function AdminAnnouncementsScreen() {
  const { formKey, ...props } = useAdminAnnouncementsViewModel()
  return <AnnouncementsTabView key={formKey} {...props} />
}
