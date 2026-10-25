import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Devices picked in Settings > Audio. Kept in this browser only; `undefined` means the system default. */
type AudioPreferencesState = {
  inputDeviceId: string | undefined
  outputDeviceId: string | undefined
  setInputDevice: (deviceId: string | undefined) => void
  setOutputDevice: (deviceId: string | undefined) => void
}

const useAudioPreferencesStore = create<AudioPreferencesState>()(
  persist(
    (set) => ({
      inputDeviceId: undefined,
      outputDeviceId: undefined,
      setInputDevice: (inputDeviceId) => set({ inputDeviceId }),
      setOutputDevice: (outputDeviceId) => set({ outputDeviceId }),
    }),
    { name: 'gameplay-audio-preferences' },
  ),
)

export { useAudioPreferencesStore }
