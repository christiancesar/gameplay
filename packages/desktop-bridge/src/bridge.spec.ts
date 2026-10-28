import { describe, expect, it, vi } from 'vitest'

import { createBridge } from './bridge'
import { DESKTOP_CHANNELS } from './names'

describe('createBridge', () => {
  it('has one function per channel of the contract, `on` for the events, and nothing more', () => {
    const bridge = createBridge(vi.fn(), vi.fn())

    expect(Object.keys(bridge).sort()).toEqual([...DESKTOP_CHANNELS, 'on'].sort())
  })

  it('hands the channel and the input to invoke and gives back the answer', async () => {
    const invoke = vi.fn().mockResolvedValue('https://play.example.com')
    const bridge = createBridge(invoke, vi.fn())

    expect(await bridge['server:get-url']()).toBe('https://play.example.com')
    expect(invoke).toHaveBeenCalledWith('server:get-url', undefined)

    await bridge['server:set-url']('https://other.example.com')
    expect(invoke).toHaveBeenLastCalledWith('server:set-url', 'https://other.example.com')
  })

  it('hands the listener to subscribe and gives back what stops it', () => {
    const stop = vi.fn()
    const subscribe = vi.fn(() => stop)
    const bridge = createBridge(vi.fn(), subscribe)
    const listener = vi.fn()

    const unsubscribe = bridge.on('system-audio:pcm', listener)

    expect(subscribe).toHaveBeenCalledWith('system-audio:pcm', listener)
    expect(unsubscribe).toBe(stop)
  })
})
