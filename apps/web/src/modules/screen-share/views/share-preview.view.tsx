import { EyeIcon, EyeOffIcon, MonitorUpIcon, SquareIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'

type SharePreviewViewProps = {
  /** The video already attached to the local capture (the Screen does the attaching). */
  video: ReactNode
  hidden: boolean
  onToggleHidden: () => void
  onStop: () => void
}

/** The tile the streamer sees in the room stage while sharing, like the "You are presenting" card of a meeting. */
function SharePreviewView({ video, hidden, onToggleHidden, onStop }: SharePreviewViewProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('share.preview.title')}
      className="bg-muted/60 flex flex-col gap-2 rounded-xl border border-red-600/40 p-3"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-black">
        <span className="absolute top-2 left-2 z-10 rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
          LIVE
        </span>
        {hidden ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <MonitorUpIcon className="size-8 text-white/70" aria-hidden />
            <p className="max-w-xs text-xs text-white/70">{t('share.preview.hiddenHint')}</p>
          </div>
        ) : (
          video
        )}
      </div>
      <p className="text-sm font-medium">{t('share.preview.title')}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="destructive" onClick={onStop}>
          <SquareIcon data-icon="inline-start" aria-hidden />
          {t('share.preview.stop')}
        </Button>
        <Button size="sm" variant="secondary" onClick={onToggleHidden}>
          {hidden ? (
            <EyeIcon data-icon="inline-start" aria-hidden />
          ) : (
            <EyeOffIcon data-icon="inline-start" aria-hidden />
          )}
          {hidden ? t('share.preview.show') : t('share.preview.hide')}
        </Button>
      </div>
    </section>
  )
}

export { SharePreviewView }
export type { SharePreviewViewProps }
