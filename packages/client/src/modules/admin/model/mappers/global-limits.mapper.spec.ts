import { describe, expect, it } from 'vitest'

import { toGlobalLimits, toPlatformSettings } from './global-limits.mapper'

const settings = { maxServersPerUser: 1, maxMembersPerServer: 10, maxRoomsPerServer: 2 }
const limits = { serversPerUser: 1, membersPerServer: 10, roomsPerServer: 2 }

describe('global limits mappers', () => {
  it('maps the settings to the form values', () => {
    expect(toGlobalLimits(settings)).toEqual(limits)
  })

  it('maps the form values back to the settings', () => {
    expect(toPlatformSettings(limits)).toEqual(settings)
  })
})
