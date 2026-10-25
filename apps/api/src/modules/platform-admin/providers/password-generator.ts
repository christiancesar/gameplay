import { Injectable } from '@nestjs/common'
import { randomCode } from '../../../common/crypto/random-code'

// Passwords the admin generates for a reset. Tests use a fixed one.
export abstract class PasswordGenerator {
  abstract generate(): string
}

// 16 characters without look-alikes (0/O, 1/l/I), easy to read out: about
// 92 bits.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const LENGTH = 16

@Injectable()
export class CryptoPasswordGenerator extends PasswordGenerator {
  generate(): string {
    return randomCode(ALPHABET, LENGTH)
  }
}
