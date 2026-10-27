import { describe, expect, it } from 'vitest'

import { AVATAR_MAX_BYTES, validateAvatarFile } from './validate-avatar-file'

describe('validateAvatarFile', () => {
  it('accepts jpeg, png and webp up to the limit', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(validateAvatarFile({ type, size: AVATAR_MAX_BYTES })).toBeUndefined()
    }
  })

  it('refuses other formats', () => {
    expect(validateAvatarFile({ type: 'image/gif', size: 10 })).toBe('invalidType')
    expect(validateAvatarFile({ type: '', size: 10 })).toBe('invalidType')
  })

  it('refuses files above the limit', () => {
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_MAX_BYTES + 1 })).toBe('tooLarge')
  })

  it('checks the format before the size', () => {
    expect(validateAvatarFile({ type: 'image/gif', size: AVATAR_MAX_BYTES + 1 })).toBe('invalidType')
  })
})
