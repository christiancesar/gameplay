import type { ChannelHandlers } from '@gameplay/desktop-bridge'

import type { ServerAddressService } from './services/server-address.service'

/** The channels of the server module: they only pass the call to the service. */
export function serverHandlers(
  service: ServerAddressService,
): Pick<ChannelHandlers, 'server:get-url' | 'server:set-url'> {
  return {
    'server:get-url': () => service.current(),
    'server:set-url': (origin) => service.set(origin),
  }
}
