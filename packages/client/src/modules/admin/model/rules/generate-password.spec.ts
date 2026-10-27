import { describe, expect, it } from 'vitest'

import { generatePassword, PASSWORD_ALPHABET, PASSWORD_LENGTH } from './generate-password'

describe('generatePassword', () => {
  it('has the fixed length and only alphabet characters', () => {
    const password = generatePassword()
    expect(password).toHaveLength(PASSWORD_LENGTH)
    expect([...password].every((char) => PASSWORD_ALPHABET.includes(char))).toBe(true)
  })

  it('maps each random value onto the alphabet', () => {
    expect(generatePassword((size) => new Uint32Array(size).fill(PASSWORD_ALPHABET.length))).toBe('A'.repeat(16))
  })

  it('is different on each call', () => {
    expect(generatePassword()).not.toBe(generatePassword())
  })
})
