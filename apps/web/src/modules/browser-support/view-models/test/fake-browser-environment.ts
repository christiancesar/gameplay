import { vi } from 'vitest'

import type { BrowserSource } from '../../model/rules/detect-browser'
import type { GpuInfo } from '../../model/rules/is-acceleration-off'
import type { BrowserEnvironment } from '../../model/services/browser-environment.service'

type FakeEnvironmentState = { browser: BrowserSource; gpu: GpuInfo; publicIps: string[] }

/** `BrowserEnvironment` over plain state the spec can change before rendering. */
function createFakeBrowserEnvironment(state: FakeEnvironmentState) {
  const environment: BrowserEnvironment = {
    readBrowser: () => state.browser,
    readGpu: () => state.gpu,
    gatherPublicIps: vi.fn(async () => state.publicIps),
  }
  return { environment, state }
}

export { createFakeBrowserEnvironment }
