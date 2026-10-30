import { useTranslation } from 'react-i18next'

import { HubView } from '@/modules/hub/views/hub.view'

import { HOME_DEMO_LANGUAGE_OPTIONS, HOME_DEMO_SERVERS, HOME_DEMO_USER } from './demo-data'

const noop = () => undefined

function HubDemoView() {
  const { i18n } = useTranslation()

  return (
    <HubView
      user={HOME_DEMO_USER}
      isPlatformAdmin={false}
      servers={HOME_DEMO_SERVERS}
      isLoadingServers={false}
      canCreateServer
      isJoining={false}
      theme="dark"
      language={i18n.resolvedLanguage ?? i18n.language}
      languageOptions={HOME_DEMO_LANGUAGE_OPTIONS}
      onOpenServer={noop}
      onCreateServer={noop}
      onJoin={noop}
      onOpenAdmin={noop}
      onOpenSettings={noop}
      isSigningOut={false}
      onSignOut={noop}
      onToggleTheme={noop}
      onLanguageChange={noop}
    />
  )
}

export { HubDemoView }
