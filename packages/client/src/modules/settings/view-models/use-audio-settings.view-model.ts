import { useCallback, useEffect, useRef, useState } from 'react'

import { useAudioPreferencesStore } from '@/modules/rooms/view-models/stores/audio-preferences.store'
import {
  audioDevices,
  type AudioDeviceList,
  type MicrophonePermission,
} from '@/modules/settings/model/services/audio-devices.service'
import { micLevelMeter } from '@/modules/settings/model/services/mic-level.service'

const DEFAULT_DEVICE = 'default'
const NO_DEVICES: AudioDeviceList = { microphones: [], outputs: [] }

/** A saved device that is no longer plugged in falls back to the system default. */
function selectedId(saved: string | undefined, available: readonly { id: string }[]): string {
  return saved && available.some((device) => device.id === saved) ? saved : DEFAULT_DEVICE
}

/** Settings > Audio: device lists, the choice (kept in the audio preferences store) and the mic test. */
function useAudioSettingsViewModel() {
  const inputDeviceId = useAudioPreferencesStore((state) => state.inputDeviceId)
  const outputDeviceId = useAudioPreferencesStore((state) => state.outputDeviceId)
  const setInputDevice = useAudioPreferencesStore((state) => state.setInputDevice)
  const setOutputDevice = useAudioPreferencesStore((state) => state.setOutputDevice)

  const [permission, setPermission] = useState<MicrophonePermission>('prompt')
  const [devices, setDevices] = useState<AudioDeviceList>(NO_DEVICES)
  const [isTesting, setIsTesting] = useState(false)
  const [inputLevel, setInputLevel] = useState(0)

  const stopTest = useRef<(() => void) | undefined>(undefined)
  // Bumped on every start/stop so a start that resolves late can tell it was cancelled.
  const testRun = useRef(0)

  const loadDevices = useCallback(async () => {
    setDevices(await audioDevices.list())
  }, [])

  useEffect(() => {
    let active = true
    void audioDevices.queryPermission().then(async (state) => {
      if (!active) return
      setPermission(state)
      if (state === 'granted') await loadDevices()
    })
    const unsubscribe = audioDevices.onChange(() => void loadDevices())
    return () => {
      active = false
      unsubscribe()
    }
  }, [loadDevices])

  const endTest = useCallback(() => {
    testRun.current += 1
    stopTest.current?.()
    stopTest.current = undefined
    setIsTesting(false)
    setInputLevel(0)
  }, [])

  // The microphone must not stay open after the modal closes.
  useEffect(() => endTest, [endTest])

  const beginTest = useCallback(
    async (deviceId: string | undefined) => {
      endTest()
      const run = testRun.current
      setIsTesting(true)
      try {
        const stop = await micLevelMeter.start(deviceId, setInputLevel)
        if (run !== testRun.current) return stop()
        stopTest.current = stop
      } catch {
        if (run !== testRun.current) return
        endTest()
        setPermission('denied')
      }
    },
    [endTest],
  )

  const microphoneId = selectedId(inputDeviceId, devices.microphones)
  const outputId = selectedId(outputDeviceId, devices.outputs)

  return {
    permission,
    microphones: devices.microphones,
    outputs: devices.outputs,
    microphoneId,
    outputId,
    isTesting,
    inputLevel,
    onMicrophoneChange: (deviceId: string) => {
      const next = deviceId === DEFAULT_DEVICE ? undefined : deviceId
      setInputDevice(next)
      // Switching while the test runs moves the meter to the new device.
      if (isTesting) void beginTest(next)
    },
    onOutputChange: (deviceId: string) => setOutputDevice(deviceId === DEFAULT_DEVICE ? undefined : deviceId),
    onToggleTest: () => {
      if (isTesting) endTest()
      else void beginTest(inputDeviceId && microphoneId !== DEFAULT_DEVICE ? inputDeviceId : undefined)
    },
    onRequestPermission: async () => {
      const state = await audioDevices.requestPermission()
      setPermission(state)
      if (state === 'granted') await loadDevices()
    },
  }
}

export { useAudioSettingsViewModel }
