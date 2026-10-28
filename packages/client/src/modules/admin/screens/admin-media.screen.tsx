import { useAdminMediaViewModel } from '@/modules/admin/view-models/use-admin-media.view-model'
import { MediaOffConfirmDialogView } from '@/modules/admin/views/media-off-confirm-dialog.view'
import { MediaTabView } from '@/modules/admin/views/media-tab.view'

export function AdminMediaScreen() {
  const { mediaTab, confirmDialog } = useAdminMediaViewModel()

  return (
    <>
      <MediaTabView {...mediaTab} />
      <MediaOffConfirmDialogView {...confirmDialog} />
    </>
  )
}
