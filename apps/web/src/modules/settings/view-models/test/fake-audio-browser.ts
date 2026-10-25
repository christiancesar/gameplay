import { vi } from 'vitest'

type FakeDevice = Pick<MediaDeviceInfo, 'deviceId' | 'kind' | 'label'>

/** A fake `navigator.mediaDevices` + `navigator.permissions` pair for the audio services. */
function createFakeAudioBrowser(devices: FakeDevice[] = [], permission: PermissionState | 'unsupported' = 'granted') {
  const track = { stop: vi.fn() }
  const listeners = new Set<() => void>()
  const mediaDevices = {
    enumerateDevices: vi.fn(async () => devices as MediaDeviceInfo[]),
    getUserMedia: vi.fn(async () => ({ getTracks: () => [track] }) as unknown as MediaStream),
    addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: () => void) => listeners.delete(listener)),
  }
  const permissions = {
    query: vi.fn(async () => {
      if (permission === 'unsupported') throw new TypeError('microphone is not a valid permission name')
      return { state: permission }
    }),
  }
  return {
    track,
    mediaDevices: mediaDevices as unknown as Required<
      import('../../model/services/audio-devices.service').AudioDevicesEnv
    >['mediaDevices'],
    permissions,
    spies: mediaDevices,
    emitDeviceChange: () => listeners.forEach((listener) => listener()),
  }
}

export { createFakeAudioBrowser }
export type { FakeDevice }
