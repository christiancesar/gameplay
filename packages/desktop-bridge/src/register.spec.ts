import { describe, expect, it, vi } from 'vitest'

import type { CaptureSource } from './channels'
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
    'capture:can-list': vi.fn(() => true),
    'capture:list-sources': vi.fn((): CaptureSource[] => [
      { id: 'window:1:0', name: 'Game', kind: 'window', thumbnail: 'data:image/jpeg;base64,AAAA', appIcon: null },
    ]),
    'capture:select-source': vi.fn((_id: string | null) => undefined),
    'system-audio:available': vi.fn(() => true),
    'system-audio:start': vi.fn((_scope?: { scope: string }) => true),
    'system-audio:stop': vi.fn(() => undefined),
    'diagnostics:record': vi.fn(() => undefined),
    'diagnostics:status': vi.fn(() => ({ diagnostics: false, cdpPort: null, mainInspectPort: null, devtools: false })),
    'mcp:status': vi.fn(() => ({
      state: 'inactive' as const,
      endpoint: null,
      token: null,
      configuration: null,
      tools: [],
      clients: [],
    })),
    'mcp:start': vi.fn(() => ({
      state: 'inactive' as const,
      endpoint: null,
      token: null,
      configuration: null,
      tools: [],
      clients: [],
    })),
    'mcp:stop': vi.fn(() => ({
      state: 'inactive' as const,
      endpoint: null,
      token: null,
      configuration: null,
      tools: [],
      clients: [],
    })),
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

  it('validates and routes local diagnostic events', async () => {
    const { call, handlers } = setup()
    const event = {
      name: 'lifecycle.state.changed',
      attemptId: 'attempt-1',
      at: new Date().toISOString(),
      data: { state: 'started', detail: null },
    }

    expect(await call('diagnostics:record', event)).toBeUndefined()
    expect(handlers['diagnostics:record']).toHaveBeenCalledWith(event)
    await expect(call('diagnostics:record', { ...event, attemptId: '' })).rejects.toThrow()
  })

  it('answers the list of applications and checks what it holds', async () => {
    const { call, handlers } = setup()

    expect(await call('audio:list-apps')).toEqual([{ name: 'Spotify', binary: 'spotify' }])
    handlers['audio:list-apps'].mockReturnValue([{ name: '', binary: null }])
    await expect(call('audio:list-apps')).rejects.toThrow()
  })

  it('takes a source id of the capturer or null, and nothing else', async () => {
    const { call, handlers } = setup()

    await call('capture:select-source', 'screen:0:0')
    await call('capture:select-source', 'window:590528:0')
    await call('capture:select-source', null)
    await expect(call('capture:select-source', 'file:///etc/passwd')).rejects.toThrow()
    await expect(call('capture:select-source', '')).rejects.toThrow()
    await expect(call('capture:select-source', 'window:1 0')).rejects.toThrow()

    expect(handlers['capture:select-source']).toHaveBeenCalledTimes(3)
  })

  it('answers the sources and refuses a preview that is not an image data URL', async () => {
    const { call, handlers } = setup()

    expect(await call('capture:list-sources')).toHaveLength(1)

    handlers['capture:list-sources'].mockReturnValue([
      { id: 'window:1:0', name: 'x', kind: 'window', thumbnail: 'https://evil.example/a.png', appIcon: null },
    ])
    await expect(call('capture:list-sources')).rejects.toThrow()
  })

  it('starts the system audio for the whole computer or for a window, and nothing else', async () => {
    const { call, handlers } = setup()

    expect(await call('system-audio:start')).toBe(true)
    expect(await call('system-audio:start', { scope: 'system' })).toBe(true)
    expect(await call('system-audio:start', { scope: 'window', sourceId: 'window:590528:0' })).toBe(true)
    await expect(call('system-audio:start', { scope: 'window' })).rejects.toThrow()
    await expect(call('system-audio:start', { scope: 'window', sourceId: 'C:\\Windows' })).rejects.toThrow()
    await expect(call('system-audio:start', { scope: 'everything' })).rejects.toThrow()

    expect(handlers['system-audio:start']).toHaveBeenCalledTimes(3)
  })
})
