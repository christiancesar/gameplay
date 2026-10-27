import { Injectable } from '@nestjs/common'
import { REGISTRATION_KEY_ALPHABET, SERVER_INVITE_CODE_LENGTH } from '@gameplay/contracts'
import { randomCode } from '../../../../../common/crypto/random-code'
import { InviteCodeGenerator } from '../invite-code-generator.provider'

// 8 characters of the registration key alphabet: about 10^12 codes, each
// valid for an hour, so a collision is left to the unique index.
@Injectable()
export class CryptoInviteCodeGenerator extends InviteCodeGenerator {
  generate(): string {
    return randomCode(REGISTRATION_KEY_ALPHABET, SERVER_INVITE_CODE_LENGTH)
  }
}
