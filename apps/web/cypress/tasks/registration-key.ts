import { createHmac, randomInt } from 'node:crypto'

// Same alphabet and length as `@gameplay/contracts` (registration-key.ts).
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const KEY_LENGTH = 6
const SUFFIX_LENGTH = 3

function randomKey(): string {
  return Array.from({ length: KEY_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
}

/** Same HMAC-SHA256 as `HmacTokenHasher` (apps/api registration-invites/providers/token-hasher.ts). */
function hashKey(key: string, secret: string): string {
  return createHmac('sha256', secret).update(key).digest('hex')
}

export { hashKey, randomKey, SUFFIX_LENGTH }
