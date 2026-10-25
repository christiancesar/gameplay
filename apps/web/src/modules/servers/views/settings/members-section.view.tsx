import { CrownIcon, EllipsisVerticalIcon, ShieldIcon, ShieldOffIcon, UserXIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ServerRole } from '@/modules/servers/views/server-sidebar.view'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { UserAvatar } from '@/shared/ui/user-avatar'

type MemberItem = {
  id: string
  /** `name` é o displayUsername (ou o username); e-mail de outra pessoa não chega aqui. */
  user: { name: string; username: string; avatarUrl?: string }
  role: ServerRole
  isMe: boolean
  /** Como entrou: quem criou o convite usado. Ausente para o owner, que criou o servidor. */
  joinedVia?: { invitedBy: string; joinedAt: string }
}

type MembersSectionViewProps = {
  members: readonly MemberItem[]
  memberLimit: number
  onPromote: (memberId: string) => void
  onDemote: (memberId: string) => void
  onKick: (memberId: string) => void
}

function MembersSectionView({ members, memberLimit, onPromote, onDemote, onKick }: MembersSectionViewProps) {
  const { t, i18n } = useTranslation()
  // Membro aguardando confirmação de kick (estado do diálogo, só apresentação).
  const [kickTarget, setKickTarget] = useState<MemberItem>()

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        {t('serverSettings.members.count', { count: members.length, max: memberLimit })}
      </p>
      <ul className="divide-y rounded-md border">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 px-4 py-3">
            <UserAvatar name={member.user.name} imageUrl={member.user.avatarUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {member.user.name}
                {member.isMe && (
                  <span className="text-muted-foreground font-normal"> ({t('serverSettings.members.you')})</span>
                )}
              </p>
              <p className="text-muted-foreground truncate text-xs">@{member.user.username}</p>
              <p className="text-muted-foreground truncate text-xs">
                {member.joinedVia
                  ? t('serverSettings.members.invitedBy', {
                      name: member.joinedVia.invitedBy,
                      date: formatRelativeTime(member.joinedVia.joinedAt, i18n.language),
                    })
                  : t('serverSettings.members.founder')}
              </p>
            </div>
            <Badge variant={member.role === 'member' ? 'outline' : 'secondary'}>
              {member.role === 'owner' && <CrownIcon data-icon="inline-start" aria-hidden />}
              {member.role === 'admin' && <ShieldIcon data-icon="inline-start" aria-hidden />}
              {t(`server.roles.${member.role}`)}
            </Badge>
            {member.role === 'owner' || member.isMe ? (
              <span className="size-8" aria-hidden />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`${t('common.actions')}: ${member.user.name}`}>
                    <EllipsisVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {member.role === 'member' ? (
                    <DropdownMenuItem onSelect={() => onPromote(member.id)}>
                      <ShieldIcon />
                      {t('serverSettings.members.promote')}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => onDemote(member.id)}>
                      <ShieldOffIcon />
                      {t('serverSettings.members.demote')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setKickTarget(member)}>
                    <UserXIcon />
                    {t('serverSettings.members.kick')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </li>
        ))}
      </ul>

      <AlertDialog open={Boolean(kickTarget)} onOpenChange={(open) => !open && setKickTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('serverSettings.members.kickTitle', { name: kickTarget?.user.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('serverSettings.members.kickDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => kickTarget && onKick(kickTarget.id)}>
              {t('serverSettings.members.kick')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export { MembersSectionView }
export type { MemberItem, MembersSectionViewProps }
