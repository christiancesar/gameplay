import { createHmac } from 'node:crypto'
import { IceProvider, type IssuedIce } from '../ice.provider'

type Options = {
  stunUrls: string[]
  turnUrls: string[]
  secret: string
  ttlSeconds: number
}

// coturn's REST API scheme (use-auth-secret): the username is
// "<expiry unix time>:<userId>" and the password is base64(HMAC-SHA1(secret,
// username)). coturn checks both with the shared secret, so nothing is stored.
export class CoturnIceProvider extends IceProvider {
  constructor(private readonly options: Options) {
    super()
  }

  async issue(userId: string): Promise<IssuedIce> {
    const { stunUrls, turnUrls, secret, ttlSeconds } = this.options
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds
    const username = `${expiresAt}:${userId}`
    const credential = coturnCredential(secret, username)
    return {
      iceServers: [{ urls: stunUrls }, { urls: turnUrls, username, credential }],
      ttlSeconds,
    }
  }
}

export function coturnCredential(secret: string, username: string): string {
  return createHmac('sha1', secret).update(username).digest('base64')
}
