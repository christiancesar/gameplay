import { describe, expect, it } from 'vitest'

import { onServer } from './server-url'

describe('onServer', () => {
  it('keeps a same-origin path as it is when the server is the page', () => {
    expect(onServer('/monitoring/sentry', '')).toBe('/monitoring/sentry')
  })

  it('puts a path on the origin of the server the app talks to', () => {
    expect(onServer('/monitoring/sentry', 'https://play.example.com')).toBe(
      'https://play.example.com/monitoring/sentry',
    )
  })

  it('leaves a full URL alone', () => {
    expect(onServer('https://collector.example.com/faro', 'https://play.example.com')).toBe(
      'https://collector.example.com/faro',
    )
  })
})
