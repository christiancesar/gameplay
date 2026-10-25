import { REGISTRATION_KEY_ALPHABET, REGISTRATION_KEY_LENGTH } from '@gameplay/contracts'
import { CryptoTokenGenerator } from './token-generator'

describe('CryptoTokenGenerator', () => {
  const generator = new CryptoTokenGenerator()

  it('generates keys of the right length from the alphabet', () => {
    const pattern = new RegExp(`^[${REGISTRATION_KEY_ALPHABET}]{${REGISTRATION_KEY_LENGTH}}$`)

    for (let i = 0; i < 200; i++) expect(generator.generate()).toMatch(pattern)
  })

  it('does not repeat keys', () => {
    const keys = new Set(Array.from({ length: 200 }, () => generator.generate()))

    expect(keys.size).toBe(200)
  })
})
