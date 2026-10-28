import { describe, expect, it, vi } from 'vitest'

import { registerChannels, type ChannelHandlers, type IpcMainLike } from './register'
import { DESKTOP_CHANNELS } from './names'

type Listener = Parameters<IpcMainLike['handle']>[1]

function setup(isTrustedPage = (url: string) => url.startsWith('app://gameplay/')) {
  const listeners = new Map<string, Listener>()
  const ipc: IpcMainLike = { handle: (channel, listener) => void listeners.set(channel, listener) }
  const handlers = {
    'server:get-url': vi.fn(() => 'https://play.example.com' as string | null),
    'server:set-url': vi.fn(async () => undefined),
    'audio:available': vi.fn(() => true),
    'audio:list-apps': vi.fn((): { name: string; binary: string | null }[] => [{ name: 'Spotify', binary: 'spotify' }]),
    'audio:share': vi.fn(async () => true),
    'audio:stop': vi.fn(() => undefined),
  } satisfies ChannelHandlers
  registerChannels(ipc, handlers, isTrustedPage)
  const call = (channel: string, input?: unknown, page: string | null = 'app://gameplay/') =>
    listeners.get(channel)!({ senderFrame: page ? { url: page } : null }, input)
  return { listeners, handlers, call }
}

describe('registerChannels', () => {
  it('answers every channel of the contract and none other', () => {
    expect([...setup().listeners.keys()].sort()).toEqual([...DESKTOP_CHANNELS].sort())
  })

  it('runs the handler with a valid input and answers what it returned', async () => {
    const { call, handlers } = setup()

    expect(await call('server:get-url')).toBe('https://play.example.com')
    await call('server:set-url', 'https://other.example.com')

    expect(handlers['server:set-url']).toHaveBeenCalledWith('https://other.example.com')
  })

  it('refuses an input that is not what the channel takes, without running the handler', async () => {
    const { call, handlers } = setup()

    await expect(call('server:set-url', 'http://play.example.com')).rejects.toThrow()
    await expect(call('server:set-url', 42)).rejects.toThrow()
    await expect(call('server:set-url', 'https://play.example.com/path')).rejects.toThrow()
    expect(handlers['server:set-url']).not.toHaveBeenCalled()
  })

  it('refuses a call from a page that is not the app, or with no frame at all', async () => {
    const { call, handlers } = setup()

    await expect(call('server:get-url', undefined, 'https://evil.example.com/')).rejects.toThrow(
      'did not come from the app',
    )
    await expect(call('server:get-url', undefined, null)).rejects.toThrow('did not come from the app')
    expect(handlers['server:get-url']).not.toHaveBeenCalled()
  })

  it('refuses an answer that is not what the channel returns', async () => {
    const { call, handlers } = setup()
    handlers['server:get-url'].mockReturnValue('http://play.example.com')

    await expect(call('server:get-url')).rejects.toThrow()
  })

  it('takes a share of named applications or of the system, and nothing else', async () => {
    const { call, handlers } = setup()

    expect(await call('audio:share', { mode: 'apps', apps: ['Spotify'] })).toBe(true)
    expect(await call('audio:share', { mode: 'system' })).toBe(true)
    await expect(call('audio:share', { mode: 'apps', apps: [] })).rejects.toThrow()
    await expect(call('audio:share', { mode: 'everything' })).rejects.toThrow()
    await expect(call('audio:share', { mode: 'apps', apps: [''] })).rejects.toThrow()

    expect(handlers['audio:share']).toHaveBeenCalledTimes(2)
  })

  it('answers the list of applications and checks what it holds', async () => {
    const { call, handlers } = setup()

    expect(await call('audio:list-apps')).toEqual([{ name: 'Spotify', binary: 'spotify' }])
    handlers['audio:list-apps'].mockReturnValue([{ name: '', binary: null }])
    await expect(call('audio:list-apps')).rejects.toThrow()
  })
})
