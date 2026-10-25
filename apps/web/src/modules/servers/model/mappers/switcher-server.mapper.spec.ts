import { describe, expect, it } from 'vitest'

import { joinedServer, ownedServer } from '@/modules/servers/view-models/test/servers-seed'

import { toSwitcherServers } from './switcher-server.mapper'

describe('toSwitcherServers', () => {
  it('turns null icons into undefined', () => {
    expect(toSwitcherServers([ownedServer, joinedServer])).toEqual([
      { id: 's1', name: 'Turbex', iconUrl: undefined },
      { id: 's2', name: 'Clan Zero', iconUrl: '/icons/s2.webp' },
    ])
  })
})
