import { createHmac } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { EnvService } from '../../../../../env/env.service'
import { TokenHasher } from '../token-hasher.provider'

// HMAC-SHA256 with a server secret: a 6-character key has ~10^9 combinations,
// so a plain hash leaked with the database could be brute-forced.
@Injectable()
export class HmacTokenHasher extends TokenHasher {
  private readonly secret: string

  constructor(env: EnvService) {
    super()
    this.secret = env.get('REGISTRATION_KEY_SECRET')
  }

  hash(token: string): string {
    return createHmac('sha256', this.secret).update(token).digest('hex')
  }
}
