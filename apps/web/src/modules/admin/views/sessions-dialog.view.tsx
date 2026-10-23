import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

type AdminSessionItem = {
  id: string
  ip: string
  /** User agent já resumido (ex.: "Chrome 141 · Windows"). */
  device: string
  lastActiveAt: string
  isActiveNow: boolean
}

type SessionsDialogViewProps = {
  open: boolean
  userName: string
  sessions: readonly AdminSessionItem[]
  onOpenChange: (open: boolean) => void
  onEndSession: (sessionId: string) => void
}

function SessionsDialogView({ open, userName, sessions, onOpenChange, onEndSession }: SessionsDialogViewProps) {
  const { t, i18n } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('admin.sessions.title', { name: userName })}</DialogTitle>
        </DialogHeader>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('admin.sessions.empty')}</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.sessions.ip')}</TableHead>
                  <TableHead>{t('admin.sessions.device')}</TableHead>
                  <TableHead>{t('admin.sessions.lastActive')}</TableHead>
                  <TableHead className="w-20">
                    <span className="sr-only">{t('common.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-xs">{session.ip}</TableCell>
                    <TableCell>{session.device}</TableCell>
                    <TableCell>
                      {session.isActiveNow ? (
                        <Badge variant="secondary">{t('admin.sessions.current')}</Badge>
                      ) : (
                        formatRelativeTime(session.lastActiveAt, i18n.language)
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onEndSession(session.id)}>
                        {t('admin.sessions.end')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { SessionsDialogView }
export type { AdminSessionItem, SessionsDialogViewProps }
