import type { IceServer } from '@gameplay/shared'

export type IssuedIce = {
  iceServers: IceServer[]
  // 0 for STUN only: nothing expires.
  ttlSeconds: number
}

// Where the WebRTC ICE servers come from, picked by ICE_PROVIDER.
export abstract class IceProvider {
  abstract issue(userId: string): Promise<IssuedIce>
}
