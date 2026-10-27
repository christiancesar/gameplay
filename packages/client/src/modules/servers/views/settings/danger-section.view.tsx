import { LogOutIcon, Trash2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { ServerRole } from '@/modules/servers/views/server-sidebar.view'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'

type DangerSectionViewProps = {
  role: Exclude<ServerRole, 'member'>
  serverName: string
  isBusy: boolean
  onLeave: () => void
  onDelete: () => void
}

function DangerSectionView({ role, serverName, isBusy, onLeave, onDelete }: DangerSectionViewProps) {
  const { t } = useTranslation()

  if (role === 'admin') {
    return (
      <div className="border-destructive/40 flex flex-col gap-3 rounded-md border p-4">
        <h3 className="font-medium">{t('serverSettings.danger.leaveTitle')}</h3>
        <p className="text-muted-foreground text-sm">{t('serverSettings.danger.leaveDescription')}</p>
        <ConfirmDialog
          trigger={
            <Button variant="destructive" className="self-start" disabled={isBusy}>
              <LogOutIcon data-icon="inline-start" aria-hidden />
              {t('serverSettings.danger.leave')}
            </Button>
          }
          title={t('server.leaveServerTitle', { server: serverName })}
          description={t('serverSettings.danger.leaveDescription')}
          confirmLabel={t('server.leaveServerConfirm')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={onLeave}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">{t('serverSettings.danger.ownerCantLeave')}</p>
      <div className="border-destructive/40 flex flex-col gap-3 rounded-md border p-4">
        <h3 className="font-medium">{t('serverSettings.danger.deleteTitle')}</h3>
        <p className="text-muted-foreground text-sm">{t('serverSettings.danger.deleteDescription')}</p>
        <ConfirmDialog
          trigger={
            <Button variant="destructive" className="self-start" disabled={isBusy}>
              <Trash2Icon data-icon="inline-start" aria-hidden />
              {t('serverSettings.danger.delete')}
            </Button>
          }
          title={t('serverSettings.danger.deleteTitle')}
          description={t('serverSettings.danger.deleteDescription')}
          confirmLabel={t('serverSettings.danger.delete')}
          cancelLabel={t('common.cancel')}
          destructive
          typeToConfirm={{ value: serverName, label: t('serverSettings.danger.confirmName', { name: serverName }) }}
          onConfirm={onDelete}
        />
      </div>
    </div>
  )
}

export { DangerSectionView }
export type { DangerSectionViewProps }
