import { describe, expect, it } from 'vitest'

import { findServerName, removalNoticeKey } from './server-removed.mapper'

describe('removalNoticeKey', () => {
  it('maps each reason to its F13 notice', () => {
    expect(removalNoticeKey('kicked')).toBe('notices.kicked')
    expect(removalNoticeKey('deleted')).toBe('notices.serverDeleted')
    expect(removalNoticeKey('left')).toBe('notices.leftServer')
  })
})

describe('findServerName', () => {
  it('prefers the detail cache', () => {
    expect(findServerName('s1', { name: 'Turbex' }, [{ id: 's1', name: 'Old' }])).toBe('Turbex')
  })

  it('falls back to the list item with that id', () => {
    expect(
      findServerName('s2', undefined, [
        { id: 's1', name: 'A' },
        { id: 's2', name: 'B' },
      ]),
    ).toBe('B')
  })

  it('returns undefined when nothing is cached', () => {
    expect(findServerName('s1', undefined, undefined)).toBeUndefined()
    expect(findServerName('s1', undefined, { items: [] })).toBeUndefined()
  })
})
