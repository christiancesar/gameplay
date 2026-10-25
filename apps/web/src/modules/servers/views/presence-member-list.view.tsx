import { cn } from 'cn'
import { CrownIcon, ShieldIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { UserAvatar } from '@/shared/ui/user-avatar'

import type { PresenceMember } from '@/modules/servers/model/entities/presence-member'

function PresenceMemberList({ members }: { members: readonly PresenceMember[] }) {
  const { t } = useTranslation()
  return (
    <ul className="flex flex-col">
      {members.map((member) => (
        <li
          key={member.id}
          className={cn('flex h-8 items-center gap-2 px-2 text-sm', !member.isOnline && 'opacity-60')}
        >
          <span className="relative">
            <UserAvatar name={member.name} imageUrl={member.avatarUrl} size="sm" className="size-5" />
            {member.isOnline && (
              <span
                className="ring-sidebar absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-emerald-500 ring-2"
                aria-hidden
              />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate">{member.name}</span>
          {member.role === 'owner' && (
            <CrownIcon className="text-muted-foreground size-3.5" role="img" aria-label={t('server.roles.owner')} />
          )}
          {member.role === 'admin' && (
            <ShieldIcon className="text-muted-foreground size-3.5" role="img" aria-label={t('server.roles.admin')} />
          )}
        </li>
      ))}
    </ul>
  )
}

export { PresenceMemberList }
