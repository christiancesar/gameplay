import { describe, expect, it } from 'vitest'

import { members, serverDetail } from '@/modules/servers/view-models/test/server-screen-seed'

import { toSidebarRooms } from './sidebar-rooms.mapper'

const participant = (userId: string, extra = {}) => ({
  userId,
  muted: false,
  deafened: false,
  streaming: null,
  streamMode: null,
  ...extra,
})

describe('toSidebarRooms', () => {
  it('orders rooms by position and leaves empty rooms without participants', () => {
    const rooms = toSidebarRooms(serverDetail.rooms, [], members)
    expect(rooms.map((room) => [room.id, room.participants.length])).toEqual([
      ['r1', 0],
      ['r2', 0],
    ])
  })

  it('maps participants with mute, deafen and live state', () => {
    const rooms = toSidebarRooms(
      serverDetail.rooms,
      [
        {
          roomId: 'r1',
          participants: [
            participant('u2', { muted: true }),
            participant('u1', { deafened: true, streaming: '720p30' }),
          ],
        },
      ],
      members,
    )
    expect(rooms[0].participants).toEqual([
      {
        id: 'u2',
        name: 'ana',
        avatarUrl: undefined,
        isMuted: true,
        isDeafened: false,
        isSpeaking: false,
        isLive: false,
      },
      {
        id: 'u1',
        name: 'turbex',
        avatarUrl: '/avatars/u1.webp',
        isMuted: false,
        isDeafened: true,
        isSpeaking: false,
        isLive: true,
      },
    ])
  })

  it('leaves out participants that are not members (yet)', () => {
    const rooms = toSidebarRooms(serverDetail.rooms, [{ roomId: 'r1', participants: [participant('ghost')] }], members)
    expect(rooms[0].participants).toEqual([])
  })
})
