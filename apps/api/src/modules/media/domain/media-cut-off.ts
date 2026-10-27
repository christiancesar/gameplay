import type { MediaResource, MediaSettings } from '@gameplay/contracts'
import type { Seat } from '../../realtime/domain/seat'

export type CutOff = Record<MediaResource, string[]>

// Who loses each resource when the settings of their server go from before
// to after: everyone in a room with a share in a mode that went off, and
// everyone on a server that lost TURN.
export function cutOff(
  seats: Seat[],
  before: (serverId: string) => MediaSettings,
  after: (serverId: string) => MediaSettings,
): CutOff {
  const modesByRoom = new Map<string, Set<string>>()
  for (const seat of seats) {
    if (!seat.streamMode) continue
    const modes = modesByRoom.get(seat.roomId) ?? new Set()
    modes.add(seat.streamMode)
    modesByRoom.set(seat.roomId, modes)
  }

  const result: CutOff = { sfu: [], mesh: [], turn: [] }
  for (const seat of seats) {
    const [was, is] = [before(seat.serverId), after(seat.serverId)]
    for (const resource of ['sfu', 'mesh', 'turn'] as const) {
      if (!was[resource] || is[resource]) continue
      if (resource !== 'turn' && !modesByRoom.get(seat.roomId)?.has(resource)) continue
      result[resource].push(seat.userId)
    }
  }
  return result
}
