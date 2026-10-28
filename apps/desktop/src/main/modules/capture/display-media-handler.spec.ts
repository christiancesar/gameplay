import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ desktopCapturer: { getSources: vi.fn() } }))

import { pickSource } from './display-media-handler'

describe('pickSource', () => {
  it('takes the first screen even when windows come first', () => {
    const sources = [{ id: 'window:1:0' }, { id: 'screen:0:0' }, { id: 'screen:1:0' }]
    expect(pickSource(sources)).toEqual({ id: 'screen:0:0' })
  })

  it('takes what there is when it is not a screen, such as the window the portal returned', () => {
    expect(pickSource([{ id: 'window:7:0' }])).toEqual({ id: 'window:7:0' })
  })

  it('takes nothing when there is no source', () => {
    expect(pickSource([])).toBeNull()
  })
})
