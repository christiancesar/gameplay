import { cn } from 'cn'
import { EyeOffIcon, MaximizeIcon, MinimizeIcon, UsersIcon, Volume2Icon, VolumeXIcon } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { StageParticipant } from '@/modules/rooms/model/entities/stage-participant'
import { ParticipantStripView } from '@/modules/rooms/views/participant-strip.view'
import { formatKbps } from '@/shared/ui/format-kbps'
import { IconButton } from '@/shared/ui/icon-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Slider } from '@/shared/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

/** Medido no lado de quem assiste: pode ser menor do que o streamer envia. */
type ReceivedQuality = { width: number; height: number; fps: number; kbps: number }

const QUALITY_LEVELS = ['auto', 'high', 'medium', 'low'] as const
/** Quanto quem assiste quer baixar. Auto deixa a rede decidir. */
type QualityLevel = (typeof QUALITY_LEVELS)[number]

type StreamViewerViewProps = {
  streamerName: string
  /** What reaches this viewer; missing until it is measured. */
  received?: ReceivedQuality
  /** False when the stream carries no audio (the streamer did not share it or the browser gave none). */
  hasAudio?: boolean
  /** Elemento de vídeo já ligado ao stream (a Screen faz a ligação com o MediaStream). */
  video: ReactNode
  liveStreams: readonly { id: string; name: string }[]
  currentStreamId: string
  streamVolume: number
  /** Sem o callback, o seletor de qualidade não aparece. */
  qualityLevel?: QualityLevel
  onQualityLevelChange?: (level: QualityLevel) => void
  participants: readonly StageParticipant[]
  /** The video over the whole screen with the controls on top. The ViewModel decides when (button, phone sideways). */
  immersive?: boolean
  onImmersiveChange: (immersive: boolean) => void
  onSwitchStream: (participantId: string) => void
  onStopWatching: () => void
  onStreamVolumeChange: (volume: number) => void
  onWatch: (participantId: string) => void
  onVolumeChange: (participantId: string, volume: number) => void
  /** Opens the server sidebar from the immersive player, which covers the app bar. */
  sidebarTrigger?: ReactNode
}

/** In the immersive player the controls hide after this long without a touch. */
const CONTROLS_HIDE_MS = 3000

/** Immersive player: the bar and the people fade out together, and a tap on the video brings them back. */
const OVERLAY_FADE =
  'transition-opacity group-data-[controls=hidden]:pointer-events-none group-data-[controls=hidden]:opacity-0'

function StreamViewerView({
  streamerName,
  received,
  hasAudio = true,
  video,
  liveStreams,
  currentStreamId,
  streamVolume,
  qualityLevel = 'auto',
  onQualityLevelChange,
  participants,
  immersive = false,
  onImmersiveChange,
  onSwitchStream,
  onStopWatching,
  onStreamVolumeChange,
  onWatch,
  onVolumeChange,
  sidebarTrigger,
}: StreamViewerViewProps) {
  const { t } = useTranslation()
  const [controlsVisible, setControlsVisible] = useState(true)
  const [peopleOpen, setPeopleOpen] = useState(false)
  // Bumped on every touch inside the player, so the hide timer starts over.
  const [activity, setActivity] = useState(0)
  const [wasImmersive, setWasImmersive] = useState(immersive)

  // Entering or leaving immersive starts with the controls shown and the people closed.
  if (wasImmersive !== immersive) {
    setWasImmersive(immersive)
    setControlsVisible(true)
    setPeopleOpen(false)
  }

  useEffect(() => {
    if (!immersive || !controlsVisible || peopleOpen) return
    const timer = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS)
    return () => clearTimeout(timer)
  }, [immersive, controlsVisible, peopleOpen, activity])

  const shown = !immersive || controlsVisible
  // Over the video the buttons stay white in both themes.
  const overlayButton = immersive ? 'text-white hover:bg-white/15 hover:text-white' : undefined

  return (
    <div
      data-stream-stage=""
      data-immersive={immersive || undefined}
      data-controls={shown ? 'shown' : 'hidden'}
      onPointerDown={() => setActivity((count) => count + 1)}
      className={cn(
        'group relative flex h-full flex-col gap-4 p-4',
        immersive && 'fixed inset-0 z-50 h-dvh gap-0 bg-black p-0 text-white',
      )}
    >
      <header
        className={cn(
          'flex flex-wrap items-center gap-3',
          immersive &&
            'absolute inset-x-0 top-0 z-20 bg-linear-to-b from-black/80 to-transparent px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-8',
          immersive && OVERLAY_FADE,
        )}
      >
        {immersive && sidebarTrigger}
        <span className="rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
          LIVE
        </span>
        <h1 className="min-w-0 truncate font-medium">{t('share.isLive', { name: streamerName })}</h1>
        {received && (
          <span
            title={t('share.receiving')}
            aria-label={`${t('share.receiving')}: ${received.height}p, ${Math.round(received.fps)} fps, ${formatKbps(received.kbps)}`}
            className={cn('font-mono text-xs tabular-nums', immersive ? 'text-white/80' : 'text-muted-foreground')}
          >
            {received.height}p · {Math.round(received.fps)} fps
            <span className="max-sm:hidden"> · {formatKbps(received.kbps)}</span>
          </span>
        )}

        {liveStreams.length > 1 && (
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={currentStreamId}
            onValueChange={(next) => next && onSwitchStream(next)}
            aria-label={t('share.liveNow')}
            className="ml-2"
          >
            {liveStreams.map((stream) => (
              <ToggleGroupItem key={stream.id} value={stream.id} className="px-3 text-xs">
                {stream.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        <div className="ml-auto flex items-center gap-2">
          {onQualityLevelChange && (
            <Select value={qualityLevel} onValueChange={(value) => onQualityLevelChange(value as QualityLevel)}>
              <SelectTrigger size="sm" aria-label={t('share.quality.label')} className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {t(`share.quality.levels.${level}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasAudio ? (
            <Volume2Icon className={cn('size-4', !immersive && 'text-muted-foreground')} aria-hidden />
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <VolumeXIcon className="size-4" aria-hidden />
              <span className={cn(immersive && 'max-sm:sr-only')}>{t('share.noStreamAudio')}</span>
            </span>
          )}
          <Slider
            disabled={!hasAudio}
            aria-label={t('share.streamVolume')}
            className="w-24 sm:w-28"
            min={0}
            max={100}
            step={5}
            value={[streamVolume]}
            onValueChange={([next]) => onStreamVolumeChange(next)}
          />
          {immersive && (
            <IconButton
              label={t('share.people')}
              icon={<UsersIcon />}
              className={overlayButton}
              aria-pressed={peopleOpen}
              onClick={() => setPeopleOpen((open) => !open)}
            />
          )}
          <IconButton
            label={immersive ? t('share.exitFullscreen') : t('share.fullscreen')}
            icon={immersive ? <MinimizeIcon /> : <MaximizeIcon />}
            className={overlayButton}
            onClick={() => onImmersiveChange(!immersive)}
          />
          <IconButton
            label={t('share.stopWatching')}
            icon={<EyeOffIcon />}
            className={overlayButton}
            onClick={onStopWatching}
          />
        </div>
      </header>

      {/* Left out of immersive on a sideways phone, the people go beside the video. */}
      <div className={cn('flex min-h-0 flex-1 flex-col gap-4', immersive ? 'gap-0' : 'phone-landscape:flex-row')}>
        <div
          onDoubleClick={() => onImmersiveChange(!immersive)}
          className={cn(
            'flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-black',
            immersive && 'rounded-none',
          )}
        >
          {video}
        </div>

        {immersive && (
          <button
            type="button"
            aria-label={t('share.toggleControls')}
            className="absolute inset-0 z-10"
            onClick={() => setControlsVisible((visible) => !visible)}
            onDoubleClick={() => onImmersiveChange(false)}
          />
        )}

        {immersive ? (
          peopleOpen && (
            <div
              className={cn(
                'absolute top-16 right-2 bottom-2 z-20 w-56 overflow-y-auto rounded-xl bg-black/60 p-1.5 text-white backdrop-blur-sm',
                OVERLAY_FADE,
              )}
            >
              <ParticipantStripView
                participants={participants}
                watchedId={currentStreamId}
                layout="column"
                onWatch={onWatch}
                onVolumeChange={onVolumeChange}
              />
            </div>
          )
        ) : (
          <ParticipantStripView
            participants={participants}
            watchedId={currentStreamId}
            onWatch={onWatch}
            onVolumeChange={onVolumeChange}
          />
        )}
      </div>
    </div>
  )
}

export { StreamViewerView }
export type { ReceivedQuality, StreamViewerViewProps }
