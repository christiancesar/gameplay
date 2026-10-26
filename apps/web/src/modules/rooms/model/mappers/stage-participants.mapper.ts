import type { Participant, ServerMember } from '@gameplay/contracts'

import type { StageParticipant } from '@/modules/rooms/model/entities/stage-participant'
import { memberName } from '@/modules/servers/model/mappers/presence-members.mapper'

import type { PeerConnectionStatus } from '../entities/voice-state'
import { volumeOf } from '../rules/volume'

type StageInput = {
  participants: readonly Participant[]
  members: readonly ServerMember[]
  selfId: string | undefined
  peers: Readonly<Record<string, PeerConnectionStatus>>
  speaking: Readonly<Record<string, boolean>>
  volumes: Readonly<Record<string, number>>
}

/**
 * A tile per person in the room, in join order. People missing from the member list (still loading,
 * or just removed) are left out. Nobody is "connecting" to themselves.
 */
function toStageParticipants({
  participants,
  members,
  selfId,
  peers,
  speaking,
  volumes,
}: StageInput): StageParticipant[] {
  const byId = new Map(members.map((member) => [member.user.id, member]))
  return participants.flatMap((participant) => {
    const member = byId.get(participant.userId)
    if (!member) return []
    const isMe = participant.userId === selfId
    return [
      {
        id: participant.userId,
        name: memberName(member),
        avatarUrl: member.user.image ?? undefined,
        isMe,
        isMuted: participant.muted,
        isDeafened: participant.deafened,
        isSpeaking: speaking[participant.userId] === true,
        isLive: participant.streaming !== null,
        connection: isMe ? 'connected' : (peers[participant.userId] ?? 'connecting'),
        volume: volumeOf(volumes, participant.userId),
      },
    ]
  })
}

export { toStageParticipants }
