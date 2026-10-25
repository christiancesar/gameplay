import { createHmac } from 'node:crypto'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function decodeBase32(value: string): Buffer {
  let bits = ''
  for (const char of value.toUpperCase().replace(/=+$/, '')) {
    const index = BASE32.indexOf(char)
    if (index < 0) throw new Error('Invalid base32 secret')
    bits += index.toString(2).padStart(5, '0')
  }
  const bytes = bits.match(/.{8}/g) ?? []
  return Buffer.from(bytes.map((byte) => Number.parseInt(byte, 2)))
}

/** RFC 6238 (SHA-1, 6 digits, 30 s), the defaults Better Auth uses for its TOTP. */
function generateTotp(secret: string, now = Date.now()): string {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 1000 / 30)))
  const hmac = createHmac('sha1', decodeBase32(secret)).update(counter).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff
  return String(binary % 1_000_000).padStart(6, '0')
}

/** Milliseconds until the current 30 s window ends. */
function msUntilNextWindow(now = Date.now()): number {
  return 30_000 - (now % 30_000)
}

export { generateTotp, msUntilNextWindow }
