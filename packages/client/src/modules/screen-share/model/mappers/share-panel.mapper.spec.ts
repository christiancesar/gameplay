import { describe, expect, it } from 'vitest'

import { idleShare, type ShareSnapshot } from '../entities/share'
import { toSharePanelState, toViewerQualities } from './share-panel.mapper'

const live: ShareSnapshot = {
  ...idleShare,
  status: 'live',
  settings: { source: 'window', resolution: '1080p', fps: 60, includeAudio: true, audioApps: [] },
  audio: 'active',
  viewerIds: ['u2', 'u3', 'u4'],
  stats: {
    u2: { width: 1920, height: 1080, fps: 60, kbps: 8000, limitation: 'none' },
    u3: { width: 1280, height: 720, fps: 42, kbps: 2000, limitation: 'bandwidth' },
  },
}
const profiles = { u2: { name: 'Ana', avatarUrl: '/ana.webp' }, u3: { name: 'Bruna' } }

describe('share panel mapper', () => {
  it('maps the idle and picking states', () => {
    expect(toSharePanelState(idleShare)).toEqual({ status: 'idle' })
    expect(toSharePanelState({ ...idleShare, status: 'picking' })).toEqual({ status: 'picking' })
  })

  it('maps the live monitor from the worst measured viewer', () => {
    expect(toSharePanelState(live)).toEqual({
      status: 'live',
      source: 'window',
      target: { resolution: '1080p', fps: 60 },
      delivering: { width: 1280, height: 720, fps: 42, kbps: 10_000 },
      isOnTarget: false,
      limitation: 'bandwidth',
      viewerCount: 3,
      audio: 'active',
      mode: 'mesh',
    })
  })

  it('through the SFU, shows what goes up to the server instead of the worst viewer', () => {
    const uplink = { width: 1920, height: 1080, fps: 60, kbps: 9000, limitation: 'none' as const }
    expect(toSharePanelState({ ...live, mode: 'sfu', uplink })).toMatchObject({
      mode: 'sfu',
      delivering: { width: 1920, height: 1080, fps: 60, kbps: 9000 },
      isOnTarget: true,
      viewerCount: 3,
    })
  })

  it('shows nothing delivered while nobody has been measured', () => {
    const state = toSharePanelState({ ...live, viewerIds: ['u4'], stats: {} })
    expect(state).toMatchObject({ status: 'live', delivering: undefined, isOnTarget: true, viewerCount: 1 })
  })

  it('lists measured viewers with their names and whether they are on target', () => {
    expect(toViewerQualities(live, profiles)).toEqual([
      {
        id: 'u2',
        name: 'Ana',
        avatarUrl: '/ana.webp',
        quality: { width: 1920, height: 1080, fps: 60, kbps: 8000 },
        isOnTarget: true,
        limitation: 'none',
      },
      {
        id: 'u3',
        name: 'Bruna',
        avatarUrl: undefined,
        quality: { width: 1280, height: 720, fps: 42, kbps: 2000 },
        isOnTarget: false,
        limitation: 'bandwidth',
      },
    ])
  })

  it('falls back to the id for a viewer without profile', () => {
    expect(toViewerQualities(live, {}).map((viewer) => viewer.name)).toEqual(['u2', 'u3'])
  })
})
