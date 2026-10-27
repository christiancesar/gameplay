import { describe, expect, it } from 'vitest'

import { connectedRoomName } from './connected-room-name'

const rooms = [
  { id: 'r1', name: 'Lobby', position: 0 },
  { id: 'r2', name: 'Raid', position: 1 },
]

describe('connectedRoomName', () => {
  it('finds the room of the connection', () => {
    expect(connectedRoomName({ serverId: 's1', roomId: 'r2' }, rooms)).toBe('Raid')
  })

  it('is empty without connection, without rooms or with an unknown room', () => {
    expect(connectedRoomName(null, rooms)).toBe('')
    expect(connectedRoomName({ serverId: 's1', roomId: 'r2' }, undefined)).toBe('')
    expect(connectedRoomName({ serverId: 's1', roomId: 'x' }, rooms)).toBe('')
  })
})
