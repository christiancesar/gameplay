import type { DeviceReport } from '@gameplay/contracts'

import { createQueryClientContext } from '@/shared/test/query-client-context'
import { fakeHttp } from '@/shared/test/fake-http'

/** QueryClient wired to the fake http: `GET /me/devices` answers with the given reports. */
function createHardwareViewModelContext(devices: DeviceReport[] = []) {
  fakeHttp.get.mockImplementation(async (url: string) => {
    if (url === '/me/devices') return { data: { devices } }
    throw new Error(`unexpected GET ${url}`)
  })
  return createQueryClientContext()
}

export { createHardwareViewModelContext }
