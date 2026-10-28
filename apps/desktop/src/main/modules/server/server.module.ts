import path from 'node:path'

import { FileServerAddressProvider } from './providers/file/file.server-address.provider'
import { serverHandlers } from './server.handlers'
import { ServerAddressService } from './services/server-address.service'

/** Puts the server module together: the file in the data folder, the service on it and its channels. */
export function createServerModule(userDataDir: string) {
  const service = new ServerAddressService(new FileServerAddressProvider(path.join(userDataDir, 'server.json')))
  return { service, handlers: serverHandlers(service) }
}
