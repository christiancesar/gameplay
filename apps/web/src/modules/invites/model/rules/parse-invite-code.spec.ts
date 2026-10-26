import { describe, expect, it } from 'vitest'

import { extractInviteCode, parseInviteCode } from './parse-invite-code'

describe('parseInviteCode', () => {
  it('accepts a bare code and uppercases it', () => {
    expect(parseInviteCode('jh34sd32')).toBe('JH34SD32')
  })

  it('trims the input', () => {
    expect(parseInviteCode('  JH34SD32 \n')).toBe('JH34SD32')
  })

  it('takes the code out of a full link', () => {
    expect(parseInviteCode('https://gameplay.example.com/i/JH34SD32')).toBe('JH34SD32')
  })

  it('ignores a trailing slash, query and hash', () => {
    expect(parseInviteCode('https://host/i/jh34sd32/')).toBe('JH34SD32')
    expect(parseInviteCode('https://host/i/JH34SD32?utm=x#top')).toBe('JH34SD32')
  })

  it('rejects the wrong length', () => {
    expect(parseInviteCode('JH34SD3')).toBeNull()
    expect(parseInviteCode('JH34SD321')).toBeNull()
  })

  it('rejects characters outside the alphabet', () => {
    expect(parseInviteCode('JH34SD3!')).toBeNull()
    expect(parseInviteCode('0000OOOO')).toBeNull()
  })

  it('rejects empty input and links without a code', () => {
    expect(parseInviteCode('')).toBeNull()
    expect(parseInviteCode('   ')).toBeNull()
    expect(parseInviteCode('https://host/')).toBeNull()
  })
})

describe('extractInviteCode', () => {
  it('returns the last path segment in uppercase', () => {
    expect(extractInviteCode('https://host/i/abc')).toBe('ABC')
  })
})
