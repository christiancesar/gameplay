import { TokenHasher } from '../providers/token-hasher'

// "hmac:<key>", so tests can tell the stored value from the key.
export class FakeTokenHasher extends TokenHasher {
  hash(token: string): string {
    return `hmac:${token}`
  }
}
