import { TokenGenerator } from '../providers/token-generator'
import { TokenHasher } from '../providers/token-hasher'

// Hands out the given keys in order.
export class FakeTokenGenerator extends TokenGenerator {
  constructor(private readonly keys: string[] = ['ABC234']) {
    super()
  }

  generate(): string {
    return this.keys.shift() ?? 'ZZZ999'
  }
}

export class FakeTokenHasher extends TokenHasher {
  hash(token: string): string {
    return `hmac:${token}`
  }
}
