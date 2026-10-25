import { cn } from 'cn'
import { EyeIcon, Loader2Icon, TriangleAlertIcon, Volume2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Slider } from '@/shared/ui/slider'
import { UserAvatar } from '@/shared/ui/user-avatar'

import type { StageParticipant } from '@/modules/rooms/model/entities/stage-participant'

import { ParticipantStatusView } from './participant-status.view'

type ParticipantTileViewProps = {
  participant: StageParticipant
  compact?: boolean
  isWatched?: boolean
  onWatch: (participantId: string) => void
  onVolumeChange: (participantId: string, volume: number) => void
}

function ParticipantTileView({
  participant,
  compact = false,
  isWatched = false,
  onWatch,
  onVolumeChange,
}: ParticipantTileViewProps) {
  const { t } = useTranslation()
  const { id, name, avatarUrl, isMe, isMuted, isDeafened, isSpeaking, isLive, connection, volume } = participant

  const body = (
    <>
      <UserAvatar
        name={name}
        imageUrl={avatarUrl}
        size={compact ? 'lg' : 'xl'}
        className={cn(
          'transition-shadow',
          !compact && 'size-20 text-xl',
          isSpeaking && 'ring-4 ring-emerald-500',
          connection !== 'connected' && 'opacity-50',
        )}
      />
      <span className="flex max-w-full items-center gap-2 text-sm font-medium">
        <span className="truncate">
          {name}
          {isMe && <span className="text-muted-foreground font-normal"> ({t('voice.you')})</span>}
        </span>
        <ParticipantStatusView isMuted={isMuted} isDeafened={isDeafened} />
      </span>
    </>
  )

  return (
    <div
      data-speaking={isSpeaking || undefined}
      className={cn(
        'bg-muted/60 relative flex flex-col items-center justify-center gap-2 rounded-xl border p-3',
        compact ? 'h-36 w-40 shrink-0' : 'h-52',
        isSpeaking && 'border-emerald-500/60',
        isWatched && 'border-foreground/40',
      )}
    >
      {isLive && (
        <span className="absolute top-2 left-2 rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
          LIVE
        </span>
      )}

      {isMe ? (
        <div className="flex flex-col items-center gap-3">{body}</div>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('voice.volumeFor', { name })}
              className="focus-visible:ring-ring/50 flex flex-col items-center gap-3 rounded-lg outline-none focus-visible:ring-3"
            >
              {body}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">{t('voice.volumeFor', { name })}</p>
              <div className="flex items-center gap-3">
                <Volume2Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <Slider
                  aria-label={t('voice.volumeFor', { name })}
                  min={0}
                  max={200}
                  step={5}
                  value={[volume]}
                  onValueChange={([next]) => onVolumeChange(id, next)}
                />
                <span className="w-10 text-right font-mono text-xs tabular-nums">{volume}%</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Rodapé com altura fixa, para todos os blocos ficarem do mesmo tamanho. */}
      <div className="flex h-7 items-center justify-center">
        {connection === 'connecting' ? (
          <span className="text-muted-foreground flex items-center gap-1 text-xs" role="status">
            <Loader2Icon className="size-3 animate-spin" aria-hidden />
            {t('voice.connecting')}
          </span>
        ) : connection === 'failed' ? (
          <span className="flex items-center gap-1 text-xs text-amber-500" role="status">
            <TriangleAlertIcon className="size-3 shrink-0" aria-hidden />
            <span className="line-clamp-1">{t('voice.connectionFailed')}</span>
          </span>
        ) : isLive && !isMe && !isWatched ? (
          <Button size="sm" variant="secondary" onClick={() => onWatch(id)}>
            <EyeIcon data-icon="inline-start" aria-hidden />
            {t('share.watch')}
          </Button>
        ) : isWatched ? (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <EyeIcon className="size-3" aria-hidden />
            {t('share.watching')}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export { ParticipantTileView }
export type { ParticipantTileViewProps }
