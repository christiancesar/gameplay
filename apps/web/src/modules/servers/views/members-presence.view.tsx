import type { PresenceMember } from '@/modules/servers/model/entities/presence-member'
import { cn } from 'cn'
import { ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SidebarGroup, SidebarGroupLabel } from '@/shared/ui/sidebar'

import { PresenceMemberList } from './presence-member-list.view'

type MembersPresenceViewProps = {
  /** Já ordenados pelo ViewModel (papel, depois nome); a View só separa online e offline. */
  members: readonly PresenceMember[]
}

/** Membros do servidor na sidebar: online primeiro, offline recolhível. Some com a sidebar recolhida. */
function MembersPresenceView({ members }: MembersPresenceViewProps) {
  const { t } = useTranslation()
  const [isOfflineOpen, setOfflineOpen] = useState(false)
  const online = members.filter((member) => member.isOnline)
  const offline = members.filter((member) => !member.isOnline)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t('server.presence.online', { count: online.length })}</SidebarGroupLabel>
      {online.length === 0 ? (
        <p className="text-muted-foreground px-2 text-sm">{t('server.presence.nobodyOnline')}</p>
      ) : (
        <PresenceMemberList members={online} />
      )}
      {offline.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={isOfflineOpen}
            onClick={() => setOfflineOpen((open) => !open)}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground focus-visible:ring-ring/50 mt-2 flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium outline-none focus-visible:ring-3"
          >
            <ChevronRightIcon
              className={cn('size-3.5 transition-transform', isOfflineOpen && 'rotate-90')}
              aria-hidden
            />
            {t('server.presence.offline', { count: offline.length })}
          </button>
          {isOfflineOpen && <PresenceMemberList members={offline} />}
        </>
      )}
    </SidebarGroup>
  )
}

export { MembersPresenceView }
export type { MembersPresenceViewProps }
