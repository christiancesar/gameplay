import { CheckIcon, CopyIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

const KEY_DURATIONS = ['1d', '7d', '30d'] as const
type KeyDuration = (typeof KEY_DURATIONS)[number]

type RegistrationKeyItem = {
  id: string
  /** Só os últimos caracteres são conhecidos depois de gerada (a key fica em hash). */
  hint: string
  createdAt: string
  expiresAt: string
  status: { type: 'active' } | { type: 'used'; userName: string } | { type: 'revoked' } | { type: 'expired' }
}

type KeysTabViewProps = {
  keys: readonly RegistrationKeyItem[]
  duration: KeyDuration
  isGenerating: boolean
  /** Key recém-gerada, mostrada uma única vez. */
  newKey?: string
  newKeyCopied: boolean
  onDurationChange: (value: KeyDuration) => void
  onGenerate: () => void
  onCopyNewKey: () => void
  onCloseNewKey: () => void
  onRevoke: (keyId: string) => void
}

const STATUS_VARIANT = { active: 'secondary', used: 'outline', revoked: 'destructive', expired: 'outline' } as const

function KeysTabView({
  keys,
  duration,
  isGenerating,
  newKey,
  newKeyCopied,
  onDurationChange,
  onGenerate,
  onCopyNewKey,
  onCloseNewKey,
  onRevoke,
}: KeysTabViewProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="key-duration">{t('admin.keys.validity')}</Label>
          <Select value={duration} onValueChange={(value) => onDurationChange(value as KeyDuration)}>
            <SelectTrigger id="key-duration" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KEY_DURATIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`common.durations.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onGenerate} disabled={isGenerating} aria-busy={isGenerating}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          {t('admin.keys.generate')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.keys.key')}</TableHead>
              <TableHead>{t('admin.keys.status')}</TableHead>
              <TableHead>{t('admin.keys.created')}</TableHead>
              <TableHead>{t('admin.keys.expires')}</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">{t('common.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  {t('admin.empty')}
                </TableCell>
              </TableRow>
            )}
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-mono tracking-wider">••••{key.hint}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[key.status.type]}>
                    {key.status.type === 'used'
                      ? t('admin.keys.statuses.used', { name: key.status.userName })
                      : t(`admin.keys.statuses.${key.status.type}`)}
                  </Badge>
                </TableCell>
                <TableCell>{formatRelativeTime(key.createdAt, i18n.language)}</TableCell>
                <TableCell>{formatRelativeTime(key.expiresAt, i18n.language)}</TableCell>
                <TableCell>
                  {key.status.type === 'active' && (
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm" className="text-destructive">
                          {t('admin.keys.revoke')}
                        </Button>
                      }
                      title={t('admin.keys.revokeTitle')}
                      description={t('admin.keys.revokeDescription')}
                      confirmLabel={t('admin.keys.revoke')}
                      cancelLabel={t('common.cancel')}
                      destructive
                      onConfirm={() => onRevoke(key.id)}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(newKey)} onOpenChange={(open) => !open && onCloseNewKey()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('admin.keys.newKeyTitle')}</DialogTitle>
            <DialogDescription>{t('admin.keys.newKeyDescription')}</DialogDescription>
          </DialogHeader>
          <p className="bg-muted rounded-md py-4 text-center font-mono text-3xl font-semibold tracking-[0.4em]">
            {newKey}
          </p>
          <Button onClick={onCopyNewKey}>
            {newKeyCopied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
            {newKeyCopied ? t('common.copied') : t('common.copy')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { KEY_DURATIONS, KeysTabView }
export type { KeyDuration, KeysTabViewProps, RegistrationKeyItem }
