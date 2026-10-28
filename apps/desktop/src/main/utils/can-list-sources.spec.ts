import { describe, expect, it } from 'vitest'

import { canListSources } from './can-list-sources'

describe('canListSources', () => {
  it('lists on Windows', () => {
    expect(canListSources('win32', {})).toBe(true)
  })

  it('lists on Linux with X11, and not on Wayland, which has the system picker', () => {
    expect(canListSources('linux', { XDG_SESSION_TYPE: 'x11' })).toBe(true)
    expect(canListSources('linux', {})).toBe(true)
    expect(canListSources('linux', { XDG_SESSION_TYPE: 'wayland' })).toBe(false)
    expect(canListSources('linux', { XDG_SESSION_TYPE: 'x11', WAYLAND_DISPLAY: 'wayland-0' })).toBe(false)
  })

  it('leaves macOS to the system picker for now', () => {
    expect(canListSources('darwin', {})).toBe(false)
  })
})
