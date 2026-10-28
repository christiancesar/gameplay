import { serverOriginSchema } from '@gameplay/contracts'

import type { ServerAddressProvider } from '../providers/server-address.provider'

/** The server the app talks to: loaded once at start, then answered from memory. */
export class ServerAddressService {
  private origin: string | null = null
  private readonly provider: ServerAddressProvider

  constructor(provider: ServerAddressProvider) {
    this.provider = provider
  }

  async load(): Promise<void> {
    this.origin = await this.provider.read()
  }

  current(): string | null {
    return this.origin
  }

  /** Keeps the server the user chose. Throws when it is not an origin the app can talk to. */
  async set(origin: string): Promise<void> {
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
