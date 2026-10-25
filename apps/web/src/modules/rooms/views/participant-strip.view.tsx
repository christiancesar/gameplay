import type { StageParticipant } from '@/modules/rooms/model/entities/stage-participant'

import { ParticipantTileView } from './participant-tile.view'

type ParticipantStripViewProps = {
  participants: readonly StageParticipant[]
  /** The participant whose screen is being watched, if any. */
  watchedId?: string
  onWatch: (participantId: string) => void
  onVolumeChange: (participantId: string, volume: number) => void
}

/** The row of compact participant tiles under a large screen. */
function ParticipantStripView({ participants, watchedId, onWatch, onVolumeChange }: ParticipantStripViewProps) {
  return (
    <ul className="flex gap-3 overflow-x-auto pb-1">
      {participants.map((participant) => (
        <li key={participant.id}>
          <ParticipantTileView
            participant={participant}
            compact
            isWatched={participant.id === watchedId}
            onWatch={onWatch}
            onVolumeChange={onVolumeChange}
          />
        </li>
      ))}
    </ul>
  )
}

export { ParticipantStripView }
export type { ParticipantStripViewProps }
