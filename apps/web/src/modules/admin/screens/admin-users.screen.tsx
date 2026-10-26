import { useAdminUsersViewModel } from '@/modules/admin/view-models/use-admin-users.view-model'
import { DeviceHardwareDialogView } from '@/modules/admin/views/device-hardware-dialog.view'
import { LimitDialogView } from '@/modules/admin/views/limit-dialog.view'
import { ResetPasswordDialogView } from '@/modules/admin/views/reset-password-dialog.view'
import { SessionsDialogView } from '@/modules/admin/views/sessions-dialog.view'
import { UsersTabView } from '@/modules/admin/views/users-tab.view'

export function AdminUsersScreen() {
  const { usersTab, sessionsDialog, resetPasswordDialog, limitDialog, hardwareDialog } = useAdminUsersViewModel()

  return (
    <>
      <UsersTabView {...usersTab} />
      <SessionsDialogView {...sessionsDialog} />
      <ResetPasswordDialogView {...resetPasswordDialog} />
      <LimitDialogView {...limitDialog} />
      <DeviceHardwareDialogView {...hardwareDialog} />
    </>
  )
}
