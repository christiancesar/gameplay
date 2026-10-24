import { LogOutIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'

type AccountSectionViewProps = {
  isSigningOut: boolean
  /** Chamado depois da confirmação. */
  onSignOut: () => void
}

function AccountSectionView({ isSigningOut, onSignOut }: AccountSectionViewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground text-sm">{t('common.signOutDescription')}</p>
      <ConfirmDialog
        trigger={
          <Button variant="destructive" disabled={isSigningOut} aria-busy={isSigningOut}>
            <LogOutIcon data-icon="inline-start" aria-hidden />
            {t('common.signOut')}
          </Button>
        }
        title={t('common.signOutTitle')}
        description={t('common.signOutDescription')}
        confirmLabel={t('common.signOut')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={onSignOut}
      />
    </div>
  )
}

export { AccountSectionView }
export type { AccountSectionViewProps }
