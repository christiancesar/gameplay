import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

export function RootErrorFallback() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Alert variant="destructive">
          <AlertTitle>{t('errors.title')}</AlertTitle>
          <AlertDescription>{t('errors.description')}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>{t('errors.reload')}</Button>
      </div>
    </div>
  )
}
