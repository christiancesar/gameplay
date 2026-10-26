import type { AdminUserItem } from '@/modules/admin/model/entities/admin-user-item'
import { cn } from 'cn'
import {
  CpuIcon,
  EllipsisVerticalIcon,
  KeyRoundIcon,
  LogOutIcon,
  MonitorSmartphoneIcon,
  SearchIcon,
  ServerIcon,
  ShieldBanIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Input } from '@/shared/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { UserAvatar } from '@/shared/ui/user-avatar'

type ConfirmAction = { type: 'suspend' | 'endSessions'; user: AdminUserItem }

type UsersTabViewProps = {
  users: readonly AdminUserItem[]
  search: string
  onSearchChange: (value: string) => void
  onViewSessions: (userId: string) => void
  onViewHardware: (userId: string) => void
  onSuspend: (userId: string) => void
  onReactivate: (userId: string) => void
  onEndSessions: (userId: string) => void
  onResetPassword: (userId: string) => void
  onEditLimit: (userId: string) => void
}

function UsersTabView({
  users,
  search,
  onSearchChange,
  onViewSessions,
  onViewHardware,
  onSuspend,
  onReactivate,
  onEndSessions,
  onResetPassword,
  onEditLimit,
}: UsersTabViewProps) {
  const { t } = useTranslation()
  const [confirm, setConfirm] = useState<ConfirmAction>()

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-xs">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
        <Input
          aria-label={t('admin.search')}
          placeholder={t('admin.search')}
          value={search}
          className="pl-8"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.users.user')}</TableHead>
              <TableHead>{t('admin.users.status')}</TableHead>
              <TableHead>{t('admin.users.serverLimit')}</TableHead>
              <TableHead>{t('admin.users.sessions')}</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">{t('common.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  {t('admin.empty')}
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id} className={cn(user.isSuspended && 'opacity-60')}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.name} imageUrl={user.avatarUrl} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        {user.name}
                        {user.isPlatformAdmin && <Badge variant="secondary">admin</Badge>}
                      </p>
                      <p className="text-muted-foreground text-xs">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.isSuspended ? (
                    <Badge variant="destructive">{t('admin.users.suspended')}</Badge>
                  ) : (
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          'size-2 rounded-full',
                          user.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/50',
                        )}
                        aria-hidden
                      />
                      {user.isOnline ? t('admin.users.online') : t('admin.users.offline')}
                    </span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {user.serversOwned}/{user.serverLimit.value}
                  {!user.serverLimit.isOverride && (
                    <span className="text-muted-foreground"> ({t('admin.default')})</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">{user.sessionCount}</TableCell>
                <TableCell>
                  {!user.isPlatformAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`${t('common.actions')}: ${user.name}`}>
                          <EllipsisVerticalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onViewSessions(user.id)}>
                          <MonitorSmartphoneIcon />
                          {t('admin.users.viewSessions')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onViewHardware(user.id)}>
                          <CpuIcon />
                          {t('admin.users.viewHardware')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onEditLimit(user.id)}>
                          <ServerIcon />
                          {t('admin.users.editLimit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onResetPassword(user.id)}>
                          <KeyRoundIcon />
                          {t('admin.users.resetPassword')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={user.sessionCount === 0}
                          onSelect={() => setConfirm({ type: 'endSessions', user })}
                        >
                          <LogOutIcon />
                          {t('admin.users.endSessions')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isSuspended ? (
                          <DropdownMenuItem onSelect={() => onReactivate(user.id)}>
                            <ShieldCheckIcon />
                            {t('admin.users.reactivate')}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setConfirm({ type: 'suspend', user })}
                          >
                            <ShieldBanIcon />
                            {t('admin.users.suspend')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === 'suspend'
                ? t('admin.users.suspendTitle', { name: confirm.user.name })
                : t('admin.users.endSessionsTitle', { name: confirm?.user.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === 'suspend'
                ? t('admin.users.suspendDescription')
                : t('admin.users.endSessionsDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!confirm) return
                if (confirm.type === 'suspend') onSuspend(confirm.user.id)
                else onEndSessions(confirm.user.id)
              }}
            >
              {confirm?.type === 'suspend' ? t('admin.users.suspend') : t('admin.users.endSessions')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export { UsersTabView }
export type { UsersTabViewProps }
