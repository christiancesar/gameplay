import { describe, expect, it } from 'vitest'

import { createFakeStorage } from '../test/fake-storage'
import { createDismissedNotices } from './dismissed-notices.service'

describe('createDismissedNotices', () => {
  it('remembers a dismissed notice, per key', () => {
    const { storage } = createFakeStorage()
    const notices = createDismissedNotices(() => storage)
    expect(notices.isDismissed('vpn')).toBe(false)
    notices.dismiss('vpn')
    expect(notices.isDismissed('vpn')).toBe(true)
    expect(notices.isDismissed('acceleration')).toBe(false)
  })

  it('survives a new service over the same storage', () => {
    const { storage } = createFakeStorage()
    createDismissedNotices(() => storage).dismiss('vpn')
    expect(createDismissedNotices(() => storage).isDismissed('vpn')).toBe(true)
  })

  it('never throws when the storage is blocked', () => {
    const { storage } = createFakeStorage({ broken: true })
    const notices = createDismissedNotices(() => storage)
    expect(() => notices.dismiss('vpn')).not.toThrow()
    expect(notices.isDismissed('vpn')).toBe(false)
  })
})
