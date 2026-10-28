import { describe, expect, it } from 'vitest'

import { captureHandlers } from './capture.handlers'
import { CaptureSourceService } from './services/capture-source.service'
import { FakeCaptureSourceProvider } from './test/fake-capture-source.provider'
import { gameSource, screenSource } from './test/capture-seed'

describe('captureHandlers', () => {
  it('answers whether the app lists and the sources it lists', async () => {
    const handlers = captureHandlers(
      new CaptureSourceService(new FakeCaptureSourceProvider({ sources: [gameSource, screenSource] })),
    )

    expect(handlers['capture:can-list'](undefined)).toBe(true)
    expect((await handlers['capture:list-sources'](undefined)).map((source) => source.id)).toEqual([
      'screen:0:0',
      'window:590528:0',
    ])
  })

  it('keeps the chosen source for the next capture', () => {
    const service = new CaptureSourceService(new FakeCaptureSourceProvider())
    const handlers = captureHandlers(service)

    handlers['capture:select-source']('screen:0:0')

    expect(service.take()?.id).toBe('screen:0:0')
  })
})
