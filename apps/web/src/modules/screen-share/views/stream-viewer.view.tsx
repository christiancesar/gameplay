import { EyeOffIcon, MaximizeIcon, Volume2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { StageParticipant } from '@/modules/rooms/model/entities/stage-participant'
import { ParticipantTileView } from '@/modules/rooms/views/participant-tile.view'
import { IconButton } from '@/shared/ui/icon-button'
import { Slider } from '@/shared/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

type StreamViewerViewProps = {
  streamerName: string
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
}

function StreamViewerView({
  streamerName,
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
}: StreamViewerViewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <span className="rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
          LIVE
        </span>
        <h1 className="font-medium">{t('share.isLive', { name: streamerName })}</h1>

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
          <Volume2Icon className="text-muted-foreground size-4" aria-hidden />
          <Slider
            aria-label={t('share.streamVolume')}
            className="w-28"
            min={0}
            max={100}
            step={5}
            value={[streamVolume]}
            onValueChange={([next]) => onStreamVolumeChange(next)}
          />
          <IconButton label={t('share.fullscreen')} icon={<MaximizeIcon />} onClick={onFullscreen} />
          <IconButton label={t('share.stopWatching')} icon={<EyeOffIcon />} onClick={onStopWatching} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-black">{video}</div>

      <ul className="flex gap-3 overflow-x-auto pb-1">
        {participants.map((participant) => (
          <li key={participant.id}>
            <ParticipantTileView
              participant={participant}
              compact
              isWatched={participant.id === currentStreamId}
              onWatch={onWatch}
              onVolumeChange={onVolumeChange}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export { StreamViewerView }
export type { StreamViewerViewProps }
