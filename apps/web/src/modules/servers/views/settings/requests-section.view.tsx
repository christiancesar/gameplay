import { CheckIcon, XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { UserAvatar } from '@/shared/ui/user-avatar'

type JoinRequestItem = {
  id: string
  user: { name: string; email: string; avatarUrl?: string }
  requestedAt: string
}

type RequestsSectionViewProps = {
  requests: readonly JoinRequestItem[]
  memberCount: number
  memberLimit: number
  /** Pedido com ação em andamento. */
  busyRequestId?: string
  onApprove: (requestId: string) => void
  onDecline: (requestId: string) => void
}

function RequestsSectionView({ requests, memberCount, memberLimit, busyRequestId, onApprove, onDecline }: RequestsSectionViewProps) {
  const { t, i18n } = useTranslation()
  const isFull = memberCount >= memberLimit

  return (
    <div className="flex flex-col gap-4">
      {isFull && requests.length > 0 && (
        <Alert>
          <AlertDescription>{t('serverSettings.requests.blockedFull', { count: memberCount, max: memberLimit })}</AlertDescription>
        </Alert>
      )}
      {requests.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('serverSettings.requests.empty')}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {requests.map((request) => {
            const busy = request.id === busyRequestId
            return (
              <li key={request.id} className="flex items-center gap-3 px-4 py-3">
                <UserAvatar name={request.user.name} imageUrl={request.user.avatarUrl} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{request.user.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {request.user.email} · {t('serverSettings.requests.requestedAt', { date: formatRelativeTime(request.requestedAt, i18n.language) })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => onDecline(request.id)}>
                  <XIcon data-icon="inline-start" aria-hidden />
                  {t('serverSettings.requests.decline')}
                </Button>
                <Button size="sm" disabled={busy || isFull} onClick={() => onApprove(request.id)}>
                  <CheckIcon data-icon="inline-start" aria-hidden />
                  {t('serverSettings.requests.approve')}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export { RequestsSectionView }
export type { JoinRequestItem, RequestsSectionViewProps }
