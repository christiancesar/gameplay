import { Injectable } from '@nestjs/common'
import { REGISTRATION_KEY_ALPHABET, REGISTRATION_KEY_LENGTH } from '@gameplay/contracts'
import { randomCode } from '../../../../../common/crypto/random-code'
import { TokenGenerator } from '../token-generator.provider'

// Registration key: random characters from the alphabet without ambiguous ones.
@Injectable()
export class CryptoTokenGenerator extends TokenGenerator {
  generate(): string {
    return randomCode(REGISTRATION_KEY_ALPHABET, REGISTRATION_KEY_LENGTH)
  }
}
