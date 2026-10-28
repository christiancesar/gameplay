import { describe, expect, it } from 'vitest'

import { currentPlatform, setCurrentPlatform } from './current-platform'
import { FakePlatform } from './test/fake-platform'

describe('currentPlatform', () => {
  it('answers the platform the app mounted with', () => {
    const platform = new FakePlatform({ kind: 'desktop' })
    setCurrentPlatform(platform)
    expect(currentPlatform()).toBe(platform)
  })
})
