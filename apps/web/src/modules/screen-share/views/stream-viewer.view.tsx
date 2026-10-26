import { cn } from 'cn'
import { EyeOffIcon, MaximizeIcon, Volume2Icon, VolumeXIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { StageParticipant } from '@/modules/rooms/model/entities/stage-participant'
import { ParticipantStripView } from '@/modules/rooms/views/participant-strip.view'
import { formatKbps } from '@/shared/ui/format-kbps'
import { IconButton } from '@/shared/ui/icon-button'
import { Slider } from '@/shared/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

/** Medido no lado de quem assiste: pode ser menor do que o streamer envia. */
type ReceivedQuality = { width: number; height: number; fps: number; kbps: number }

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
  participants: readonly StageParticipant[]
  onSwitchStream: (participantId: string) => void
  onStopWatching: () => void
  onFullscreen: () => void
  onStreamVolumeChange: (volume: number) => void
  onWatch: (participantId: string) => void
  onVolumeChange: (participantId: string, volume: number) => void
  /** Opens the server sidebar; shown on a sideways phone, where the app bar is hidden. */
  sidebarTrigger?: ReactNode
}

/** On a sideways phone the bar and the people float over the video, and a tap on the video hides them. */
const OVERLAY_FADE =
  'phone-landscape:transition-opacity phone-landscape:group-data-[controls=hidden]:pointer-events-none phone-landscape:group-data-[controls=hidden]:opacity-0'

function StreamViewerView({
  streamerName,
  received,
  hasAudio = true,
  video,
  liveStreams,
  currentStreamId,
  streamVolume,
  participants,
  onSwitchStream,
  onStopWatching,
  onFullscreen,
  onStreamVolumeChange,
  onWatch,
  onVolumeChange,
  sidebarTrigger,
}: StreamViewerViewProps) {
  const { t } = useTranslation()
  const [controlsVisible, setControlsVisible] = useState(true)

  return (
    <div
      data-controls={controlsVisible ? 'shown' : 'hidden'}
      className="group phone-landscape:gap-0 phone-landscape:p-0 relative flex h-full flex-col gap-4 p-4"
    >
      <header
        className={cn(
          'phone-landscape:absolute phone-landscape:inset-x-0 phone-landscape:top-0 phone-landscape:z-10 phone-landscape:bg-linear-to-b phone-landscape:from-black/70 phone-landscape:to-transparent phone-landscape:px-3 phone-landscape:pt-2 phone-landscape:pb-6 phone-landscape:text-white flex flex-wrap items-center gap-3',
          OVERLAY_FADE,
        )}
      >
        {sidebarTrigger && <div className="phone-landscape:max-md:contents hidden">{sidebarTrigger}</div>}
        <span className="rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
          LIVE
        </span>
        <h1 className="font-medium">{t('share.isLive', { name: streamerName })}</h1>
        {received && (
          <span
            title={t('share.receiving')}
            aria-label={`${t('share.receiving')}: ${received.height}p, ${Math.round(received.fps)} fps, ${formatKbps(received.kbps)}`}
            className="text-muted-foreground phone-landscape:text-white/80 font-mono text-xs tabular-nums"
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
          {/* Phone browsers ignore both for now (no fullscreen on iPhone), so touch screens go without. */}
          <div className="touch:hidden flex items-center gap-2">
            {hasAudio ? (
              <Volume2Icon className="text-muted-foreground size-4" aria-hidden />
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <VolumeXIcon className="size-4" aria-hidden />
                {t('share.noStreamAudio')}
              </span>
            )}
            <Slider
              disabled={!hasAudio}
              aria-label={t('share.streamVolume')}
              className="w-28"
              min={0}
              max={100}
              step={5}
              value={[streamVolume]}
              onValueChange={([next]) => onStreamVolumeChange(next)}
            />
            <IconButton label={t('share.fullscreen')} icon={<MaximizeIcon />} onClick={onFullscreen} />
          </div>
          <IconButton label={t('share.stopWatching')} icon={<EyeOffIcon />} onClick={onStopWatching} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="phone-landscape:rounded-none flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-black">
          {video}
        </div>

        <button
          type="button"
          aria-label={t('share.toggleControls')}
          className="phone-landscape:block absolute inset-0 hidden"
          onClick={() => setControlsVisible((visible) => !visible)}
        />

        <div
          className={cn(
            'phone-landscape:absolute phone-landscape:top-12 phone-landscape:right-2 phone-landscape:bottom-2 phone-landscape:z-10 phone-landscape:flex phone-landscape:flex-col',
            OVERLAY_FADE,
          )}
        >
          <ParticipantStripView
            participants={participants}
            watchedId={currentStreamId}
            onWatch={onWatch}
            onVolumeChange={onVolumeChange}
          />
        </div>
      </div>
    </div>
  )
}

export { StreamViewerView }
export type { ReceivedQuality, StreamViewerViewProps }
