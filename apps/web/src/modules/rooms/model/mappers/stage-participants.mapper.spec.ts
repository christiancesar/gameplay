import { describe, expect, it } from 'vitest'

import { members } from '@/modules/servers/view-models/test/server-screen-seed'

import { participant } from '../services/test/voice-session-seed'
import { toStageParticipants } from './stage-participants.mapper'

const base = { members, selfId: 'u1', peers: {}, speaking: {}, volumes: {} }

describe('toStageParticipants', () => {
  it('builds a tile per person in join order with names and avatars', () => {
    const tiles = toStageParticipants({
      ...base,
      participants: [participant('u2'), participant('u1')],
    })
    expect(tiles.map((tile) => [tile.id, tile.name, tile.isMe])).toEqual([
      ['u2', 'ana', false],
      ['u1', 'turbex', true],
    ])
    expect(tiles[1].avatarUrl).toBe('/avatars/u1.webp')
  })

  it('takes mute, deafen and live from the participant', () => {
    const [tile] = toStageParticipants({
      ...base,
      participants: [participant('u2', { muted: true, deafened: true, streaming: '720p30' })],
    })
    expect(tile).toMatchObject({ isMuted: true, isDeafened: true, isLive: true })
  })

  it('shows peers as connecting until they report, and never connects the local user to itself', () => {
    const tiles = toStageParticipants({
      ...base,
      participants: [participant('u1'), participant('u2'), participant('u3')],
      peers: { u3: 'failed' },
    })
    expect(tiles.map((tile) => tile.connection)).toEqual(['connected', 'connecting', 'failed'])
  })

  it('adds speaking and the volume of each person, 100 by default', () => {
    const tiles = toStageParticipants({
      ...base,
      participants: [participant('u2'), participant('u3')],
      speaking: { u2: true },
      volumes: { u3: 60 },
    })
    expect(tiles.map((tile) => [tile.isSpeaking, tile.volume])).toEqual([
      [true, 100],
      [false, 60],
    ])
  })

  it('leaves out people who are not in the member list', () => {
    expect(toStageParticipants({ ...base, participants: [participant('ghost')] })).toEqual([])
  })
})
