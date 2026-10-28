import { describe, expect, it } from 'vitest'

import { FakeCaptureSourceProvider } from '../test/fake-capture-source.provider'
import { browserSource, gameSource, screenSource, untitledSource } from '../test/capture-seed'
import { CaptureSourceService } from './capture-source.service'

describe('CaptureSourceService', () => {
  it('lists the screens first and then the windows by name, without the untitled ones', async () => {
    const provider = new FakeCaptureSourceProvider({
      sources: [gameSource, untitledSource, browserSource, screenSource],
    })

    const listed = await new CaptureSourceService(provider).list()

    expect(listed.map((source) => source.name)).toEqual(['Entire screen', 'browser', 'Game'])
  })

  it('lists nothing, and does not ask the system, where the system picker chooses', async () => {
    const provider = new FakeCaptureSourceProvider({ canList: false, sources: [screenSource] })
    const service = new CaptureSourceService(provider)

    expect(service.canList()).toBe(false)
    expect(await service.list()).toEqual([])
    expect(provider.listed).toBe(0)
  })

  describe('the choice for the next capture', () => {
    it('hands out the source announced, with the name it was listed under, and only once', async () => {
      const service = new CaptureSourceService(new FakeCaptureSourceProvider({ sources: [gameSource] }))
      await service.list()

      service.select('window:590528:0')

      expect(service.take()).toEqual({ id: 'window:590528:0', name: 'Game' })
      expect(service.take()).toBeNull()
    })

    it('falls back to the id as the name for a source it did not list', () => {
      const service = new CaptureSourceService(new FakeCaptureSourceProvider())

      service.select('screen:1:0')

      expect(service.take()).toEqual({ id: 'screen:1:0', name: 'screen:1:0' })
    })

    it('forgets the choice on null, and lets a new one replace the old', () => {
      const service = new CaptureSourceService(new FakeCaptureSourceProvider())

      service.select('screen:0:0')
      service.select(null)
      expect(service.take()).toBeNull()

      service.select('screen:0:0')
      service.select('screen:1:0')
      expect(service.take()?.id).toBe('screen:1:0')
    })

    it('lets the choice expire, so an old one never captures by surprise', () => {
      let now = 1_000
      const service = new CaptureSourceService(new FakeCaptureSourceProvider(), () => now)

      service.select('screen:0:0')
      now += 10_001

      expect(service.take()).toBeNull()
    })

    it('still holds the choice a moment after it was announced', () => {
      let now = 1_000
      const service = new CaptureSourceService(new FakeCaptureSourceProvider(), () => now)

      service.select('screen:0:0')
      now += 9_999

      expect(service.take()?.id).toBe('screen:0:0')
    })
  })
})
