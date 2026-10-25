import { EyeIcon, EyeOffIcon, MonitorUpIcon, SquareIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { StageParticipant } from '@/modules/rooms/model/entities/stage-participant'
import { ParticipantStripView } from '@/modules/rooms/views/participant-strip.view'
import { Button } from '@/shared/ui/button'

type SharePreviewViewProps = {
  /** The video already attached to the local capture (the Screen does the attaching). */
  video: ReactNode
  hidden: boolean
  participants: readonly StageParticipant[]
  onToggleHidden: () => void
  onStop: () => void
  onWatch: (participantId: string) => void
  onVolumeChange: (participantId: string, volume: number) => void
}

/** The stage while I present: my own screen large, like a viewer sees it, and the participants below. */
function SharePreviewView({
  video,
  hidden,
  participants,
  onToggleHidden,
  onStop,
  onWatch,
  onVolumeChange,
}: SharePreviewViewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <span className="rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
          LIVE
        </span>
        <h1 className="font-medium">{t('share.preview.title')}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onToggleHidden}>
            {hidden ? (
              <EyeIcon data-icon="inline-start" aria-hidden />
            ) : (
              <EyeOffIcon data-icon="inline-start" aria-hidden />
            )}
            {hidden ? t('share.preview.show') : t('share.preview.hide')}
          </Button>
          <Button size="sm" variant="destructive" onClick={onStop}>
            <SquareIcon data-icon="inline-start" aria-hidden />
            {t('share.preview.stop')}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-black">
        {hidden ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <MonitorUpIcon className="size-10 text-white/70" aria-hidden />
            <p className="font-medium text-white">{t('share.preview.title')}</p>
            <p className="max-w-sm text-sm text-white/70">{t('share.preview.hiddenHint')}</p>
          </div>
        ) : (
          video
        )}
      </div>

      <ParticipantStripView participants={participants} onWatch={onWatch} onVolumeChange={onVolumeChange} />
    </div>
  )
}

export { SharePreviewView }
export type { SharePreviewViewProps }
