import { describe, expect, it, vi } from 'vitest'

import { x11WindowBinary } from './x11-window-binary'

describe('x11WindowBinary', () => {
  it('resolves the process of an X11 window to its binary', () => {
    const run = vi.fn(() => '_NET_WM_PID(CARDINAL) = 1234')
    const read = vi.fn(() => '/usr/bin/game.exe')
    expect(x11WindowBinary('window:590528:0', run as never, read as never)).toBe('game.exe')
    expect(run).toHaveBeenCalledWith('xprop', ['-id', '590528', '_NET_WM_PID'], {
      encoding: 'utf8',
      timeout: 1000,
    })
    expect(read).toHaveBeenCalledWith('/proc/1234/exe')
  })

  it('falls back when the source is invalid, the property is absent, or xprop fails', () => {
    const read = vi.fn()
    expect(x11WindowBinary('screen:0:0', vi.fn() as never, read as never)).toBeNull()
    expect(x11WindowBinary('window:10:0', vi.fn(() => 'not found') as never, read as never)).toBeNull()
    expect(
      x11WindowBinary(
        'window:10:0',
        vi.fn(() => {
          throw new Error('missing')
        }) as never,
        read as never,
      ),
    ).toBeNull()
    expect(read).not.toHaveBeenCalled()
  })
})
