import type { ErrorEvent } from '@sentry/react'
import { describe, expect, it } from 'vitest'

import { scrubEvent } from './scrub-event'

describe('scrubEvent', () => {
  it('drops cookies, auth headers and user details but keeps the id', () => {
    const event = {
      type: undefined,
      request: { cookies: { session: 'x' }, headers: { Cookie: 'a=b', Authorization: 'Bearer t', Accept: '*/*' } },
      user: { id: 'u1', email: 'a@b.c', ip_address: '1.1.1.1' },
    } as ErrorEvent
    const result = scrubEvent(event)
    expect(result.request?.cookies).toBeUndefined()
    expect(result.request?.headers).toEqual({ Accept: '*/*' })
    expect(result.user).toEqual({ id: 'u1' })
  })
})
