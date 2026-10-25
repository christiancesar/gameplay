import { randomInt } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { REGISTRATION_KEY_ALPHABET, REGISTRATION_KEY_LENGTH } from '@gameplay/shared'

export abstract class TokenGenerator {
  abstract generate(): string
}

// Registration key: random characters from the alphabet without ambiguous ones.
@Injectable()
export class CryptoTokenGenerator extends TokenGenerator {
  generate(): string {
    let key = ''
    for (let i = 0; i < REGISTRATION_KEY_LENGTH; i++) {
      key += REGISTRATION_KEY_ALPHABET[randomInt(REGISTRATION_KEY_ALPHABET.length)]
    }
    return key
  }
}
