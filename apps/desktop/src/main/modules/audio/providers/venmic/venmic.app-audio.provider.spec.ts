import { describe, expect, it, vi } from 'vitest'

import { type PatchBayConstructor, type PatchBayLike, VenmicAppAudioProvider } from './venmic.app-audio.provider'
import { x11WindowBinary } from './x11-window-binary'

vi.mock('./x11-window-binary', () => ({ x11WindowBinary: vi.fn() }))

function setup({ pipewire = true, nodes = [] as Record<string, string>[] } = {}) {
  const bay = { list: vi.fn(() => nodes), link: vi.fn(() => true), unlink: vi.fn() } satisfies PatchBayLike
  const Ctor = Object.assign(
    vi.fn(function () {
      return bay
    }),
    { hasPipeWire: () => pipewire },
  ) as unknown as PatchBayConstructor
  return { bay, provider: new VenmicAppAudioProvider(() => Ctor, 'gameplay') }
}

describe('VenmicAppAudioProvider', () => {
  it('is not available without PipeWire, or without the module', () => {
    expect(setup({ pipewire: false }).provider.available()).toBe(false)
    expect(new VenmicAppAudioProvider(() => null, 'gameplay').available()).toBe(false)
    expect(
      new VenmicAppAudioProvider(() => {
        throw new Error('no module')
      }, 'gameplay').available(),
    ).toBe(false)
    expect(setup().provider.available()).toBe(true)
  })

  it('lists each application once, leaves the app itself out and answers nothing when unavailable', () => {
    const nodes: Record<string, string>[] = [
      { 'application.name': 'Spotify', 'application.process.binary': 'spotify' },
      { 'application.name': 'Spotify', 'application.process.binary': 'spotify' },
      { 'application.name': 'Chromium', 'application.process.binary': 'gameplay' },
      { 'application.process.binary': 'nameless' },
      { 'application.name': 'mpv' },
    ]

    expect(setup({ nodes }).provider.list()).toEqual([
      { name: 'Spotify', binary: 'spotify' },
      { name: 'mpv', binary: null },
    ])
    expect(setup({ pipewire: false, nodes }).provider.list()).toEqual([])
  })

  it('links the chosen applications to the virtual microphone, never the app itself, and replaces an older choice', () => {
    const { provider, bay } = setup()

    expect(provider.share({ mode: 'apps', apps: ['Spotify', 'mpv'] })).toBe(true)

    expect(bay.unlink).toHaveBeenCalledTimes(1)
    expect(bay.link).toHaveBeenCalledWith({
      include: [{ 'application.name': 'Spotify' }, { 'application.name': 'mpv' }],
      exclude: [{ 'application.process.binary': 'gameplay' }],
      ignore_devices: true,
      only_speakers: true,
    })
  })

  it('links everything but the app itself in system mode', () => {
    const { provider, bay } = setup()

    provider.share({ mode: 'system' })

    expect(bay.link).toHaveBeenCalledWith({
      exclude: [{ 'application.process.binary': 'gameplay' }],
      ignore_devices: true,
      only_speakers: true,
    })
  })

  it('links only the chosen window application and falls back to system audio if it cannot identify it', () => {
    const { provider, bay } = setup()
    vi.mocked(x11WindowBinary).mockReturnValueOnce('game.exe').mockReturnValueOnce(null)
    provider.share({ mode: 'window', sourceId: 'window:590528:0' })
    expect(bay.link).toHaveBeenLastCalledWith({
      include: [{ 'application.process.binary': 'game.exe' }],
      exclude: [{ 'application.process.binary': 'gameplay' }],
      ignore_devices: true,
      only_speakers: true,
    })
    provider.share({ mode: 'window', sourceId: 'window:590528:0' })
    expect(bay.link).toHaveBeenLastCalledWith({
      exclude: [{ 'application.process.binary': 'gameplay' }],
      ignore_devices: true,
      only_speakers: true,
    })
  })

  it('answers false when PipeWire is missing or the link throws, and unlinks on stop', () => {
    expect(setup({ pipewire: false }).provider.share({ mode: 'system' })).toBe(false)

    const { provider, bay } = setup()
    bay.link.mockImplementation(() => {
      throw new Error('boom')
    })
    expect(provider.share({ mode: 'system' })).toBe(false)

    provider.stop()
    expect(bay.unlink).toHaveBeenCalled()
  })
})
