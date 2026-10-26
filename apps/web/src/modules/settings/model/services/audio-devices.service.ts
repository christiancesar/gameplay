type MicrophonePermission = 'granted' | 'prompt' | 'denied'

type AudioDeviceInfo = { id: string; label: string }
type AudioDeviceList = { microphones: AudioDeviceInfo[]; outputs: AudioDeviceInfo[] }

/** The slice of `navigator` this service reads, so specs can hand in a fake. */
type AudioDevicesEnv = {
  mediaDevices?: Pick<MediaDevices, 'enumerateDevices' | 'getUserMedia' | 'addEventListener' | 'removeEventListener'>
  permissions?: { query: (descriptor: { name: PermissionName }) => Promise<{ state: PermissionState }> }
}

type AudioDevicesService = {
  /** `denied` also covers browsers without the API. */
  queryPermission: () => Promise<MicrophonePermission>
  /** Opens the microphone once so the browser asks, then releases it. */
  requestPermission: () => Promise<MicrophonePermission>
  list: () => Promise<AudioDeviceList>
  /** Plugging or unplugging a device. Returns the unsubscribe. */
  onChange: (listener: () => void) => () => void
}

function toInfo(device: MediaDeviceInfo, fallback: string): AudioDeviceInfo {
  return { id: device.deviceId, label: device.label || fallback }
}

function createAudioDevicesService(env: AudioDevicesEnv): AudioDevicesService {
  async function hasLabels(): Promise<boolean> {
    const devices = (await env.mediaDevices?.enumerateDevices()) ?? []
    return devices.some((device) => device.kind === 'audioinput' && device.label !== '')
  }

  return {
    async queryPermission() {
      if (!env.mediaDevices) return 'denied'
      try {
        const status = await env.permissions?.query({ name: 'microphone' as PermissionName })
        if (status) return status.state
      } catch {
        // Firefox and Safari do not know the "microphone" permission name: fall through.
      }
      // Labels are blank until the page has been granted access.
      return (await hasLabels()) ? 'granted' : 'prompt'
    },

    async requestPermission() {
      if (!env.mediaDevices) return 'denied'
      try {
        const stream = await env.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
        return 'granted'
      } catch {
        return 'denied'
      }
    },

    async list() {
      const devices = (await env.mediaDevices?.enumerateDevices()) ?? []
      const microphones: AudioDeviceInfo[] = []
      const outputs: AudioDeviceInfo[] = []
      for (const device of devices) {
        // "default" and "communications" are aliases Chromium adds; the UI already has "System default".
        if (device.deviceId === 'default' || device.deviceId === 'communications') continue
        if (device.kind === 'audioinput') microphones.push(toInfo(device, `Microphone ${microphones.length + 1}`))
        if (device.kind === 'audiooutput') outputs.push(toInfo(device, `Speaker ${outputs.length + 1}`))
      }
      return { microphones, outputs }
    },

    onChange(listener) {
      env.mediaDevices?.addEventListener('devicechange', listener)
      return () => env.mediaDevices?.removeEventListener('devicechange', listener)
    },
  }
}

/** Reads `navigator` at call time, so importing this module is safe where it is missing. */
const audioDevices = createAudioDevicesService({
  get mediaDevices() {
    return typeof navigator === 'undefined' ? undefined : navigator.mediaDevices
  },
  get permissions() {
    return typeof navigator === 'undefined' ? undefined : navigator.permissions
  },
})

export { audioDevices, createAudioDevicesService }
export type { AudioDeviceInfo, AudioDeviceList, AudioDevicesEnv, AudioDevicesService, MicrophonePermission }
