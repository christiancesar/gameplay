import { cn } from 'cn'
import { Loader2Icon, WifiIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ConnectionBannerViewProps = {
  status: 'online' | 'reconnecting' | 'reconnected'
}

/** F13: faixa no topo enquanto a conexão com o servidor cai e volta. */
function ConnectionBannerView({ status }: ConnectionBannerViewProps) {
  const { t } = useTranslation()
  if (status === 'online') return null

  return (
    <div
      role="status"
      className={cn(
        'fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium',
        status === 'reconnecting' ? 'bg-amber-500 text-amber-950' : 'bg-emerald-600 text-white',
      )}
    >
      {status === 'reconnecting' ? (
        <>
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          {t('connection.reconnecting')}
          <span className="font-normal opacity-80">{t('connection.offlineHint')}</span>
        </>
      ) : (
        <>
          <WifiIcon className="size-4" aria-hidden />
          {t('connection.reconnected')}
        </>
      )}
    </div>
  )
}

export { ConnectionBannerView }
export type { ConnectionBannerViewProps }
