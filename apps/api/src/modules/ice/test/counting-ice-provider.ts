import { IceProvider, type IssuedIce } from '../providers/ice/ice.provider'

// Counts the issued credentials; `failing` makes it throw.
export class CountingIceProvider extends IceProvider {
  calls = 0
  failing = false

  async issue(userId: string): Promise<IssuedIce> {
    if (this.failing) throw new Error('down')
    this.calls += 1
    return {
      iceServers: [{ urls: ['turn:t:3478'], username: `${userId}-${this.calls}`, credential: 'x' }],
      ttlSeconds: 3600,
    }
  }
}
