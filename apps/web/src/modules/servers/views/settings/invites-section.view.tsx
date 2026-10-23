import { CheckIcon, CopyIcon, LinkIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { Label } from '@/shared/ui/label'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

const INVITE_MAX_USES = [1, 5, 10, 25] as const
const INVITE_DURATIONS = ['1h', '1d', '7d', '30d'] as const
type InviteDuration = (typeof INVITE_DURATIONS)[number]

type ServerInviteItem = {
  code: string
  link: string
  usesLeft: number
  maxUses: number
  expiresAt: string
  isExpired: boolean
}

type InvitesSectionViewProps = {
  invites: readonly ServerInviteItem[]
  maxUses: number
  duration: InviteDuration
  isGenerating: boolean
  /** Servidor cheio: geração bloqueada. */
  memberCount: number
  memberLimit: number
  copiedCode?: string
  onMaxUsesChange: (value: number) => void
  onDurationChange: (value: InviteDuration) => void
  onGenerate: () => void
  onCopy: (code: string) => void
  onRevoke: (code: string) => void
}

function InvitesSectionView({
  invites,
  maxUses,
  duration,
  isGenerating,
  memberCount,
  memberLimit,
  copiedCode,
  onMaxUsesChange,
  onDurationChange,
  onGenerate,
  onCopy,
  onRevoke,
}: InvitesSectionViewProps) {
  const { t, i18n } = useTranslation()
  const isFull = memberCount >= memberLimit

  return (
    <div className="flex flex-col gap-6">
      {isFull && (
        <Alert>
          <AlertDescription>{t('serverSettings.invites.blockedFull', { count: memberCount, max: memberLimit })}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-max-uses">{t('serverSettings.invites.maxUses')}</Label>
          <Select value={String(maxUses)} onValueChange={(value) => onMaxUsesChange(Number(value))} disabled={isFull}>
            <SelectTrigger id="invite-max-uses" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITE_MAX_USES.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-duration">{t('serverSettings.invites.expiresIn')}</Label>
          <Select value={duration} onValueChange={(value) => onDurationChange(value as InviteDuration)} disabled={isFull}>
            <SelectTrigger id="invite-duration" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITE_DURATIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`serverSettings.invites.durations.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onGenerate} disabled={isFull || isGenerating} aria-busy={isGenerating}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          {t('serverSettings.invites.generate')}
        </Button>
      </div>

      {invites.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('serverSettings.invites.empty')}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {invites.map((invite) => (
            <li key={invite.code} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <LinkIcon className="text-muted-foreground size-4" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-mono font-semibold tracking-wider">{invite.code}</p>
                <p className="text-muted-foreground text-xs">
                  {t('serverSettings.invites.usesLeft', { left: invite.usesLeft, max: invite.maxUses })}
                  {' · '}
                  {invite.isExpired
                    ? t('serverSettings.invites.expired')
                    : t('serverSettings.invites.expiresAt', { date: formatRelativeTime(invite.expiresAt, i18n.language) })}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onCopy(invite.code)} disabled={invite.isExpired}>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { INVITE_DURATIONS, INVITE_MAX_USES, InvitesSectionView }
export type { InviteDuration, InvitesSectionViewProps, ServerInviteItem }
