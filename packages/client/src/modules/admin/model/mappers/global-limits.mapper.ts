import type { PlatformSettings } from '@gameplay/contracts'

import type { GlobalLimits } from '@/modules/admin/model/limits.schema'

/** The form names drop the `max` prefix the API uses. */
function toGlobalLimits(settings: PlatformSettings): GlobalLimits {
  return {
    serversPerUser: settings.maxServersPerUser,
    membersPerServer: settings.maxMembersPerServer,
    roomsPerServer: settings.maxRoomsPerServer,
  }
}

function toPlatformSettings(limits: GlobalLimits): PlatformSettings {
  return {
    maxServersPerUser: limits.serversPerUser,
    maxMembersPerServer: limits.membersPerServer,
    maxRoomsPerServer: limits.roomsPerServer,
  }
}

export { toGlobalLimits, toPlatformSettings }
