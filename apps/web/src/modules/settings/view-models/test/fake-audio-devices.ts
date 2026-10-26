import { vi } from 'vitest'

import type {
  AudioDeviceList,
  AudioDevicesService,
  MicrophonePermission,
} from '../../model/services/audio-devices.service'

/** In-memory `AudioDevicesService`; `plug` simulates a device change. */
function createFakeAudioDevices(list: AudioDeviceList, permission: MicrophonePermission = 'granted') {
  const listeners = new Set<() => void>()
  const state = { list, permission, requestResult: 'granted' as MicrophonePermission }
  const service: AudioDevicesService = {
    queryPermission: vi.fn(async () => state.permission),
    requestPermission: vi.fn(async () => state.requestResult),
    list: vi.fn(async () => state.list),
    onChange: vi.fn((listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }),
  }
  return {
    service,
    state,
    plug: (next: AudioDeviceList) => {
      state.list = next
      listeners.forEach((listener) => listener())
    },
    listenerCount: () => listeners.size,
  }
}

export { createFakeAudioDevices }
