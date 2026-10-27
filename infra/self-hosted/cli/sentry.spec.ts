import { describe, expect, it } from 'vitest'
import { sentryEnvelopeUrl } from './sentry.ts'

describe('sentryEnvelopeUrl', () => {
  it('turns the DSN into the envelope endpoint', () => {
    expect(sentryEnvelopeUrl('https://abc123@o42.ingest.us.sentry.io/4507')).toBe(
      'https://o42.ingest.us.sentry.io/api/4507/envelope/',
    )
  })

  it('is empty without a DSN', () => {
    expect(sentryEnvelopeUrl('')).toBe('')
  })
})
