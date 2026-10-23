import { LogOutIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'

type AccountSectionViewProps = {
  isSigningOut: boolean
  onSignOut: () => void
}

function AccountSectionView({ isSigningOut, onSignOut }: AccountSectionViewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground text-sm">{t('settings.account.signOutDescription')}</p>
      <Button variant="destructive" disabled={isSigningOut} aria-busy={isSigningOut} onClick={onSignOut}>
        <LogOutIcon data-icon="inline-start" aria-hidden />
        {t('settings.account.signOut')}
      </Button>
    </div>
  )
}

export { AccountSectionView }
export type { AccountSectionViewProps }
