import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { UserAvatar } from '@/shared/ui/user-avatar'

type AdminServerMember = {
  id: string
  user: { name: string; email: string; avatarUrl?: string }
  role: 'owner' | 'admin' | 'member'
  joinedVia?: { inviteCode: string; invitedBy: string; joinedAt: string }
}

type ServerMembersDialogViewProps = {
  open: boolean
  serverName: string
  members: readonly AdminServerMember[]
  onOpenChange: (open: boolean) => void
}

/** Membros de um servidor e por qual convite cada um entrou. */
function ServerMembersDialogView({ open, serverName, members, onOpenChange }: ServerMembersDialogViewProps) {
  const { t, i18n } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('admin.servers.membersTitle', { name: serverName })}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60dvh] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users.user')}</TableHead>
                <TableHead>{t('admin.servers.role')}</TableHead>
                <TableHead>{t('admin.servers.joinedVia')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <UserAvatar name={member.user.name} imageUrl={member.user.avatarUrl} size="sm" />
                      <span>
                        <span className="block">{member.user.name}</span>
                        <span className="text-muted-foreground block text-xs">{member.user.email}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'member' ? 'outline' : 'secondary'}>
                      {t(`server.roles.${member.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {member.joinedVia
                      ? t('serverSettings.members.invitedBy', {
                          name: member.joinedVia.invitedBy,
                          code: member.joinedVia.inviteCode,
                          date: formatRelativeTime(member.joinedVia.joinedAt, i18n.language),
                        })
                      : t('serverSettings.members.founder')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ServerMembersDialogView }
export type { AdminServerMember, ServerMembersDialogViewProps }
