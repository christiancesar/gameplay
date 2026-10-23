import { cn } from 'cn'
import { CheckIcon, CopyIcon, LinkIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { Label } from '@/shared/ui/label'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { Switch } from '@/shared/ui/switch'

/** Convite de uso único, válido por 1 hora a partir da criação. */
type ServerInviteItem = {
  code: string
  link: string
  createdBy: { name: string }
  createdAt: string
  expiresAt: string
  status: { type: 'active' } | { type: 'used'; user: { name: string }; usedAt: string } | { type: 'expired' } | { type: 'revoked' }
}

type InvitesSectionViewProps = {
  autoApprove: boolean
  /** Convites ativos primeiro; o resto aparece no histórico. */
  invites: readonly ServerInviteItem[]
  isGenerating: boolean
  /** Servidor cheio: geração bloqueada. */
  memberCount: number
  memberLimit: number
  copiedCode?: string
  onAutoApproveChange: (value: boolean) => void
  onGenerate: () => void
  onCopy: (code: string) => void
  onRevoke: (code: string) => void
}

function InvitesSectionView({
  autoApprove,
  invites,
  isGenerating,
  memberCount,
  memberLimit,
  copiedCode,
  onAutoApproveChange,
  onGenerate,
  onCopy,
  onRevoke,
}: InvitesSectionViewProps) {
  const { t, i18n } = useTranslation()
  const isFull = memberCount >= memberLimit
  const active = invites.filter((invite) => invite.status.type === 'active')
  const history = invites.filter((invite) => invite.status.type !== 'active')

  const statusText = (invite: ServerInviteItem) => {
    const { status } = invite
    if (status.type === 'active') return t('serverSettings.invites.statuses.active', { date: formatRelativeTime(invite.expiresAt, i18n.language) })
    if (status.type === 'used')
      return t('serverSettings.invites.statuses.used', { name: status.user.name, date: formatRelativeTime(status.usedAt, i18n.language) })
    return t(`serverSettings.invites.statuses.${status.type}`)
  }

  const row = (invite: ServerInviteItem) => (
    <li key={invite.code} className="flex flex-wrap items-center gap-3 px-4 py-3">
      <LinkIcon className="text-muted-foreground size-4" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={cn('font-mono font-semibold tracking-wider', invite.status.type !== 'active' && 'text-muted-foreground')}>{invite.code}</p>
        <p className="text-muted-foreground text-xs">
          <span className={cn(invite.status.type === 'used' && 'text-foreground')}>{statusText(invite)}</span>
          {' · '}
          {t('serverSettings.invites.createdBy', { name: invite.createdBy.name })}
        </p>
      </div>
      {invite.status.type === 'active' && (
        <>
          <Button variant="outline" size="sm" onClick={() => onCopy(invite.code)}>
            {copiedCode === invite.code ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
            {copiedCode === invite.code ? t('common.copied') : t('serverSettings.invites.copyLink')}
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm" className="text-destructive">
                {t('serverSettings.invites.revoke')}
              </Button>
            }
            title={t('serverSettings.invites.revokeTitle', { code: invite.code })}
            description={t('serverSettings.invites.revokeDescription')}
            confirmLabel={t('serverSettings.invites.revoke')}
            cancelLabel={t('common.cancel')}
            destructive
            onConfirm={() => onRevoke(invite.code)}
          />
        </>
      )}
    </li>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6 rounded-md border p-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="server-auto-approve">{t('serverSettings.invites.autoApprove')}</Label>
          <p className="text-muted-foreground text-xs leading-snug">{t('serverSettings.invites.autoApproveHint')}</p>
        </div>
        <Switch id="server-auto-approve" checked={autoApprove} onCheckedChange={onAutoApproveChange} />
      </div>

      {isFull && (
        <Alert>
          <AlertDescription>{t('serverSettings.invites.blockedFull', { count: memberCount, max: memberLimit })}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{t('serverSettings.invites.rules')}</p>
        <Button onClick={onGenerate} disabled={isFull || isGenerating} aria-busy={isGenerating}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          {t('serverSettings.invites.generate')}
        </Button>
      </div>

      <section aria-label={t('serverSettings.invites.active')} className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t('serverSettings.invites.active')}</h3>
        {active.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('serverSettings.invites.empty')}</p>
        ) : (
          <ul className="divide-y rounded-md border">{active.map(row)}</ul>
        )}
      </section>

      {history.length > 0 && (
        <section aria-label={t('serverSettings.invites.history')} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t('serverSettings.invites.history')}</h3>
          <ul className="divide-y rounded-md border">{history.map(row)}</ul>
        </section>
      )}
    </div>
  )
}

export { InvitesSectionView }
export type { InvitesSectionViewProps, ServerInviteItem }
