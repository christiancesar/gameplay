import { TokenGenerator } from '../providers/token-generator/token-generator.provider'

// Hands out the given keys in order.
export class FakeTokenGenerator extends TokenGenerator {
  constructor(private readonly keys: string[] = ['ABC234']) {
    super()
  }

  generate(): string {
    return this.keys.shift() ?? 'ZZZ999'
  }
}
