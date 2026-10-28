import { serverOriginSchema } from '@gameplay/contracts'

import type { ServerAddressProvider } from '../providers/server-address.provider'

/**
 * The server the app talks to: loaded once at start, then answered from memory. A build tied to a server (`fixed`)
 * talks to that one only: nothing is read from the data folder and no other can be set.
 */
export class ServerAddressService {
  private origin: string | null = null
  private readonly provider: ServerAddressProvider
  private readonly fixed: string | null

  constructor(provider: ServerAddressProvider, fixed: string | null = null) {
    this.provider = provider
    this.fixed = fixed
  }

  async load(): Promise<void> {
    this.origin = this.fixed ?? (await this.provider.read())
  }

  current(): string | null {
    return this.origin
  }

  /** Keeps the server the user chose. Throws when it is not an origin the app can talk to. */
  async set(origin: string): Promise<void> {
    if (this.fixed) throw new Error('This build talks to one server only')
    const valid = serverOriginSchema.parse(origin)
    await this.provider.write(valid)
    this.origin = valid
  }

  /** Whether a URL is on the server the app talks to. */
  isOnServer(url: string): boolean {
    if (!this.origin) return false
    try {
      return new URL(url).origin === this.origin
    } catch {
      return false
    }
  }
}
