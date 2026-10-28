import { describe, expect, it } from 'vitest'

import { fixedServerFrom } from './fixed-server'

describe('fixedServerFrom', () => {
  it('is none when the build has no server', () => {
    expect(fixedServerFrom(undefined)).toBeNull()
    expect(fixedServerFrom('')).toBeNull()
    expect(fixedServerFrom('   ')).toBeNull()
  })

  it('is the origin the build was made with', () => {
    expect(fixedServerFrom(' https://play.example.com ')).toBe('https://play.example.com')
  })

  it('stops on a value the app cannot talk to', () => {
    expect(() => fixedServerFrom('http://play.example.com')).toThrow('VITE_SERVER_URL')
    expect(() => fixedServerFrom('https://play.example.com/api')).toThrow('VITE_SERVER_URL')
  })
})
