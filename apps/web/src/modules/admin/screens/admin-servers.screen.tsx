import { useAdminServersViewModel } from '@/modules/admin/view-models/use-admin-servers.view-model'
import { LimitDialogView } from '@/modules/admin/views/limit-dialog.view'
import { MediaOffConfirmDialogView } from '@/modules/admin/views/media-off-confirm-dialog.view'
import { ServerMembersDialogView } from '@/modules/admin/views/server-members-dialog.view'
import { ServersTabView } from '@/modules/admin/views/servers-tab.view'

export function AdminServersScreen() {
  const { serversTab, membersDialog, limitDialog, confirmDialog } = useAdminServersViewModel()

  return (
    <>
      <ServersTabView {...serversTab} />
      <ServerMembersDialogView {...membersDialog} />
      <LimitDialogView {...limitDialog} />
      <MediaOffConfirmDialogView {...confirmDialog} />
    </>
  )
}
