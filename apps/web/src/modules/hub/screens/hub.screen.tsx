import { useSignOutViewModel } from '@/modules/auth/view-models/use-sign-out.view-model'
import { HubView } from '@/modules/hub/views/hub.view'
import { useHubViewModel } from '@/modules/hub/view-models/use-hub.view-model'
import { useJoinByCodeViewModel } from '@/modules/invites/view-models/use-join-by-code.view-model'
import { NotificationsPanelView } from '@/modules/notifications/views/notifications-panel.view'
import { useNotificationsViewModel } from '@/modules/notifications/view-models/use-notifications.view-model'
import { CreateServerDialogView } from '@/modules/servers/views/create-server-dialog.view'
import { useCreateServerViewModel } from '@/modules/servers/view-models/use-create-server.view-model'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'

export function HubScreen() {
  const hub = useHubViewModel()
  const join = useJoinByCodeViewModel()
  const createServer = useCreateServerViewModel()
  const notifications = useNotificationsViewModel()
  const { signOut, isSigningOut } = useSignOutViewModel()
  const { language, languageOptions, setLanguage } = useLanguageViewModel()
  const { openDialog, ...dialog } = createServer

  return (
    <>
      <HubView
        {...hub}
        {...join}
        notifications={<NotificationsPanelView {...notifications} />}
        language={language}
        languageOptions={languageOptions}
        onLanguageChange={setLanguage}
        isSigningOut={isSigningOut}
        onSignOut={signOut}
        onCreateServer={openDialog}
      />
      <CreateServerDialogView {...dialog} />
    </>
  )
}
