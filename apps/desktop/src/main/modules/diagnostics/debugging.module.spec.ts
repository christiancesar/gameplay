import { describe, expect, it, vi } from 'vitest'

import {
  attachRendererDebugger,
  DebuggingPortError,
  configureCdp,
  openDevTools,
  openMainInspector,
} from './debugging.module'

describe('debugging module', () => {
  it('configures CDP only on the local address when a port is explicit', () => {
    const commandLine = { appendSwitch: vi.fn() }

    configureCdp(commandLine, 9223)
    configureCdp(commandLine, null)

    expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(1, 'remote-debugging-address', '127.0.0.1')
    expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(2, 'remote-debugging-port', '9223')
    expect(commandLine.appendSwitch).toHaveBeenCalledTimes(2)
  })

  it('opens and closes the main inspector locally', () => {
    const api = { open: vi.fn(), close: vi.fn(), url: vi.fn() }

    const dispose = openMainInspector(api, 9229)
    dispose?.()

    expect(api.open).toHaveBeenCalledWith(9229, '127.0.0.1', false)
    expect(api.close).toHaveBeenCalledOnce()
  })

  it('turns an occupied inspector port into an actionable error', () => {
    const api = {
      open: vi.fn(() => {
        throw new Error('EADDRINUSE')
      }),
      close: vi.fn(),
      url: vi.fn(),
    }

    expect(() => openMainInspector(api, 9229)).toThrow(DebuggingPortError)
    expect(() => openMainInspector(api, 9229)).toThrow('port 9229')
  })

  it('opens DevTools only when the caller explicitly asks', () => {
    const window = { webContents: { openDevTools: vi.fn() } }

    openDevTools(window)

    expect(window.webContents.openDevTools).toHaveBeenCalledWith({ mode: 'detach' })
  })

  it('does not attach a programmatic debugger over existing DevTools', () => {
    const contents = { debugger: { isAttached: vi.fn(() => true), attach: vi.fn(), detach: vi.fn() } }

    expect(attachRendererDebugger(contents)).toBeUndefined()
    expect(contents.debugger.attach).not.toHaveBeenCalled()
  })

  it('returns a safe detach operation for a free renderer debugger', () => {
    const contents = {
      debugger: {
        isAttached: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
        attach: vi.fn(),
        detach: vi.fn(),
      },
    }

    const detach = attachRendererDebugger(contents)
    detach?.()

    expect(contents.debugger.attach).toHaveBeenCalledWith('1.3')
    expect(contents.debugger.detach).toHaveBeenCalledOnce()
  })
})
