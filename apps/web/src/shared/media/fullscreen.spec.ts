import { describe, expect, it, vi } from 'vitest'

import { enterStreamFullscreen, exitStreamFullscreen, type FullscreenRoot, onFullscreenExit } from './fullscreen'

/** A document with one player; `stage` decides whether the browser has element fullscreen. */
function makeRoot(stage: { requestFullscreen?: () => Promise<void> } | null) {
  const listeners = new Set<() => void>()
  const root = {
    fullscreenElement: null as Element | null,
    querySelector: vi.fn(() => stage),
    exitFullscreen: vi.fn(async () => undefined),
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    emitChange: () => {
      for (const listener of listeners) listener()
    },
  }
  return root as typeof root & FullscreenRoot
}

describe('stream fullscreen', () => {
  it('puts the player in fullscreen, never the video', async () => {
    const stage = { requestFullscreen: vi.fn(async () => undefined) }
    const root = makeRoot(stage)
    await expect(enterStreamFullscreen(root)).resolves.toBe(true)
    expect(root.querySelector).toHaveBeenCalledWith('[data-stream-stage]')
    expect(stage.requestFullscreen).toHaveBeenCalledTimes(1)
  })

  it('resolves false where elements cannot go fullscreen (iPhone) or the browser refuses', async () => {
    await expect(enterStreamFullscreen(makeRoot({}))).resolves.toBe(false)
    await expect(enterStreamFullscreen(makeRoot(null))).resolves.toBe(false)
    const refusing = { requestFullscreen: vi.fn(async () => Promise.reject(new Error('no gesture'))) }
    await expect(enterStreamFullscreen(makeRoot(refusing))).resolves.toBe(false)
  })

  it('leaves fullscreen only when in it', () => {
    const root = makeRoot(null)
    exitStreamFullscreen(root)
    expect(root.exitFullscreen).not.toHaveBeenCalled()
    root.fullscreenElement = {} as Element
    exitStreamFullscreen(root)
    expect(root.exitFullscreen).toHaveBeenCalledTimes(1)
  })

  it('tells when the browser leaves fullscreen on its own', () => {
    const root = makeRoot(null)
    const handler = vi.fn()
    const stop = onFullscreenExit(handler, root)
    root.fullscreenElement = {} as Element
    root.emitChange()
    expect(handler).not.toHaveBeenCalled()
    root.fullscreenElement = null
    root.emitChange()
    expect(handler).toHaveBeenCalledTimes(1)
    stop()
    root.emitChange()
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
