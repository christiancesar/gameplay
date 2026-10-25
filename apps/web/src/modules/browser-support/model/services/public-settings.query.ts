import { queryOptions } from '@tanstack/react-query'

import { getPublicSettings } from './public-settings.service'

const publicSettingsKeys = { all: ['settings', 'public'] as const }

const publicSettingsQueryOptions = queryOptions({
  queryKey: publicSettingsKeys.all,
  queryFn: getPublicSettings,
  staleTime: 5 * 60 * 1000,
  retry: false,
})

export { publicSettingsKeys, publicSettingsQueryOptions }
