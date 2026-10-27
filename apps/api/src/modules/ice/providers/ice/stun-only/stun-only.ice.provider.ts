import { IceProvider, type IssuedIce } from '../ice.provider'

// No relay: calls fail when both sides are behind a strict NAT.
export class StunOnlyIceProvider extends IceProvider {
  constructor(private readonly stunUrls: string[]) {
    super()
  }

  async issue(): Promise<IssuedIce> {
    return { iceServers: [{ urls: this.stunUrls }], ttlSeconds: 0 }
  }
}
