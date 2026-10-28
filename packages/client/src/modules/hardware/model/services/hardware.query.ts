import { queryOptions } from '@tanstack/react-query'

import { hardwareKeys } from './hardware.keys'
import { listMyDevices } from './hardware.service'

const devicesQueryOptions = queryOptions({
  queryKey: hardwareKeys.devices(),
  queryFn: listMyDevices,
})

export { devicesQueryOptions }
