import type { MediaSettings } from '@gameplay/contracts'
import type { Seat } from '../../realtime/domain/seat'
import { cutOff } from './media-cut-off'

const seat = (userId: string, roomId: string, streamMode: Seat['streamMode'] = null, serverId = 's1'): Seat => ({
  userId,
  serverId,
  roomId,
  socketId: `${userId}-tab`,
  muted: false,
  deafened: false,
  streaming: streamMode ? '720p30' : null,
  streamMode,
})
const ALL_ON: MediaSettings = { sfu: true, mesh: true, turn: true }

describe('cutOff', () => {
  it('reaches the rooms with a share in the mode that went off', () => {
    const seats = [seat('ana', 'r1', 'sfu'), seat('bia', 'r1'), seat('caio', 'r2', 'mesh'), seat('dani', 'r3')]

    const result = cutOff(
      seats,
      () => ALL_ON,
      () => ({ sfu: false, mesh: false, turn: true }),
    )

    expect(result).toEqual({ sfu: ['ana', 'bia'], mesh: ['caio'], turn: [] })
  })

  it('reaches everyone on a server that lost TURN, and nobody whose server keeps it', () => {
    const seats = [seat('ana', 'r1'), seat('bia', 'r9', null, 's2')]

    const result = cutOff(
      seats,
      () => ALL_ON,
      (serverId) => ({ ...ALL_ON, turn: serverId === 's2' }),
    )

    expect(result.turn).toEqual(['ana'])
  })

  it('reaches nobody when the resource was already off', () => {
    const off = { sfu: false, mesh: true, turn: true }
    expect(
      cutOff(
        [seat('ana', 'r1', 'sfu')],
        () => off,
        () => off,
      ).sfu,
    ).toEqual([])
  })
})
