import { describe, expect, it } from 'vitest'

import { lobbyOccupancy, settingsDetail } from '@/modules/servers/view-models/test/server-settings-seed'

import { toRoomItems } from './settings-rooms.mapper'

describe('toRoomItems', () => {
  it('orders by position and counts who is inside', () => {
    expect(toRoomItems(settingsDetail.rooms, [lobbyOccupancy])).toEqual([
      { id: 'r1', name: 'Lobby', occupants: 2 },
      { id: 'r2', name: 'Raid', occupants: 0 },
    ])
  })
})
