import type { IceServer } from '@gameplay/contracts'

export type IssuedIce = {
  iceServers: IceServer[]
  // 0 for STUN only: nothing expires.
  ttlSeconds: number
}

// Where the WebRTC ICE servers come from, picked by ICE_PROVIDER.
export abstract class IceProvider {
  abstract issue(userId: string): Promise<IssuedIce>

  // Cuts credentials before they expire. Without a way to do it (STUN only,
  // coturn's HMAC scheme) they just run out at the end of their TTL.
  async revoke(_issued: IssuedIce): Promise<void> {}
}
