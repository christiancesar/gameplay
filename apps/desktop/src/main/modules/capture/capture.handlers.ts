import type { ChannelHandlers } from '@gameplay/desktop-bridge'

import type { CaptureSourceService } from './services/capture-source.service'

/** The channels of the capture module: they pass the call to the service. */
export function captureHandlers(
  service: CaptureSourceService,
): Pick<ChannelHandlers, 'capture:can-list' | 'capture:list-sources' | 'capture:select-source'> {
  return {
    'capture:can-list': () => service.canList(),
    'capture:list-sources': () => service.list(),
    'capture:select-source': (id) => service.select(id),
  }
}
