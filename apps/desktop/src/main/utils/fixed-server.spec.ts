import { describe, expect, it } from 'vitest'

import { fixedServerFrom } from './fixed-server'

describe('fixedServerFrom', () => {
  it('lets development leave the server empty, so the app asks for one', () => {
    expect(fixedServerFrom('development', undefined)).toBeNull()
    expect(fixedServerFrom('development', '')).toBeNull()
    expect(fixedServerFrom('development', '   ')).toBeNull()
  })

  it('ties development to a server when one is given', () => {
    expect(fixedServerFrom('development', 'http://localhost:3333')).toBe('http://localhost:3333')
  })

  it('ties production to its server', () => {
    expect(fixedServerFrom('production', ' https://play.example.com ')).toBe('https://play.example.com')
  })

  it('refuses a production build without a server', () => {
    expect(() => fixedServerFrom('production', undefined)).toThrow('VITE_SERVER_URL is required')
    expect(() => fixedServerFrom('production', '  ')).toThrow('VITE_SERVER_URL is required')
  })

  it('refuses a build that does not say what it is', () => {
    expect(() => fixedServerFrom(undefined, 'https://play.example.com')).toThrow('VITE_APP_ENV')
    expect(() => fixedServerFrom('staging', 'https://play.example.com')).toThrow('VITE_APP_ENV')
  })

  it('stops on a value the app cannot talk to', () => {
    expect(() => fixedServerFrom('production', 'http://play.example.com')).toThrow('not an origin')
    expect(() => fixedServerFrom('development', 'https://play.example.com/api')).toThrow('not an origin')
  })
})
