import { describe, expect, it } from 'vitest'

import { ICON_MAX_BYTES, validateIconFile } from './validate-icon-file'

describe('validateIconFile', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s', (type) => {
    expect(validateIconFile({ type, size: 1000 })).toBeUndefined()
  })

  it('accepts exactly 2 MB', () => {
    expect(validateIconFile({ type: 'image/png', size: ICON_MAX_BYTES })).toBeUndefined()
  })

  it('rejects a file above 2 MB', () => {
    expect(validateIconFile({ type: 'image/png', size: ICON_MAX_BYTES + 1 })).toBe('tooLarge')
  })

  it.each(['image/gif', 'application/pdf', ''])('rejects the format "%s"', (type) => {
    expect(validateIconFile({ type, size: 1000 })).toBe('invalidType')
  })

  it('reports the format first when both are wrong', () => {
    expect(validateIconFile({ type: 'image/gif', size: ICON_MAX_BYTES + 1 })).toBe('invalidType')
  })
})
