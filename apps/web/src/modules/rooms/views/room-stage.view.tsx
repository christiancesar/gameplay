import { AudioLinesIcon, MicOffIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'

import type { StageParticipant } from '@/modules/rooms/model/entities/stage-participant'

import { ParticipantTileView } from './participant-tile.view'

type RoomStageViewProps = {
  roomName: string
  participants: readonly StageParticipant[]
  micDenied: boolean
  /** The streamer's own screen while sharing; goes first in the grid. */
  preview?: ReactNode
  onWatch: (participantId: string) => void
  onVolumeChange: (participantId: string, volume: number) => void
}

function RoomStageView({ roomName, participants, micDenied, preview, onWatch, onVolumeChange }: RoomStageViewProps) {
  const { t } = useTranslation()
  const othersCount = participants.filter((participant) => !participant.isMe).length

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex items-center gap-2">
        <AudioLinesIcon className="size-5" aria-hidden />
        <h1 className="text-lg font-medium">{roomName}</h1>
      </header>

      {micDenied && (
        <Alert>
          <MicOffIcon />
          <AlertTitle>{t('voice.micDeniedTitle')}</AlertTitle>
          <AlertDescription>{t('voice.micDeniedDescription')}</AlertDescription>
        </Alert>
      )}

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
        {preview && <li className="sm:col-span-2">{preview}</li>}
        {participants.map((participant) => (
          <li key={participant.id}>
            <ParticipantTileView participant={participant} onWatch={onWatch} onVolumeChange={onVolumeChange} />
          </li>
        ))}
      </ul>

      {othersCount === 0 && <p className="text-muted-foreground text-center text-sm">{t('voice.roomEmpty')}</p>}
    </div>
  )
}

export { RoomStageView }
export type { RoomStageViewProps }
