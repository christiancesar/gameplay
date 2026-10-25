import { REGISTRATION_KEY_ALPHABET } from '@gameplay/shared'
import { InviteCodeGenerator } from '../providers/invite-code-generator'

// GAMEPL32, GAMEPL42...: valid codes, a new one each call.
export class SequentialInviteCodes extends InviteCodeGenerator {
  private count = 0

  generate(): string {
    this.count += 1
    return `GAMEPL${REGISTRATION_KEY_ALPHABET[this.count]}${REGISTRATION_KEY_ALPHABET[0]}`
  }
}
