import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeAudioDevices } from './test/fake-audio-devices'
import { createFakeMicLevelMeter } from './test/fake-mic-level-meter'
import { microphones, outputs } from './test/settings-seed'

const fakes = vi.hoisted(() => ({ devices: undefined as unknown, meter: undefined as unknown }))

vi.mock('@/modules/settings/model/services/audio-devices.service', () => ({
  audioDevices: new Proxy({}, { get: (_t, key) => (fakes.devices as never)[key] }),
}))
vi.mock('@/modules/settings/model/services/mic-level.service', () => ({
  micLevelMeter: new Proxy({}, { get: (_t, key) => (fakes.meter as never)[key] }),
}))

import { useAudioPreferencesStore } from '@/modules/rooms/view-models/stores/audio-preferences.store'

import { useAudioSettingsViewModel } from './use-audio-settings.view-model'

const setup = (permission: 'granted' | 'prompt' | 'denied' = 'granted') => {
  const devices = createFakeAudioDevices({ microphones, outputs }, permission)
  const meter = createFakeMicLevelMeter()
  fakes.devices = devices.service
  fakes.meter = meter.meter
  return { devices, meter, ...renderHook(() => useAudioSettingsViewModel()) }
}

describe('useAudioSettingsViewModel', () => {
  beforeEach(() => {
    useAudioPreferencesStore.setState({ inputDeviceId: undefined, outputDeviceId: undefined })
  })

  it('lists the devices when the permission is granted', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.microphones).toEqual(microphones))
    expect(result.current.outputs).toEqual(outputs)
    expect(result.current.permission).toBe('granted')
    expect(result.current.microphoneId).toBe('default')
  })

  it('does not list devices before the permission is granted', async () => {
    const { result, devices } = setup('prompt')
    await waitFor(() => expect(devices.service.queryPermission).toHaveBeenCalled())
    expect(result.current.permission).toBe('prompt')
    expect(result.current.microphones).toEqual([])
    expect(devices.service.list).not.toHaveBeenCalled()
  })

  it('requests the permission and then lists the devices', async () => {
    const { result } = setup('prompt')
    await act(() => result.current.onRequestPermission())
    expect(result.current.permission).toBe('granted')
    expect(result.current.microphones).toEqual(microphones)
  })

  it('keeps the denied state when the request is refused', async () => {
    const { result, devices } = setup('prompt')
    devices.state.requestResult = 'denied'
    await act(() => result.current.onRequestPermission())
    expect(result.current.permission).toBe('denied')
    expect(result.current.microphones).toEqual([])
  })

  it('saves the picked devices in the preferences store and maps default to undefined', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.microphones).toHaveLength(2))
    act(() => result.current.onMicrophoneChange('mic-2'))
    act(() => result.current.onOutputChange('out-1'))
    expect(useAudioPreferencesStore.getState()).toMatchObject({ inputDeviceId: 'mic-2', outputDeviceId: 'out-1' })
    expect(result.current.microphoneId).toBe('mic-2')
    act(() => result.current.onMicrophoneChange('default'))
    expect(useAudioPreferencesStore.getState().inputDeviceId).toBeUndefined()
  })

  it('falls back to the default when the saved device is gone', async () => {
    useAudioPreferencesStore.setState({ inputDeviceId: 'unplugged' })
    const { result } = setup()
    await waitFor(() => expect(result.current.microphones).toHaveLength(2))
    expect(result.current.microphoneId).toBe('default')
  })

  it('reloads the list when a device is plugged in', async () => {
    const { result, devices } = setup()
    await waitFor(() => expect(result.current.microphones).toHaveLength(2))
    act(() => devices.plug({ microphones: [microphones[0]!], outputs }))
    await waitFor(() => expect(result.current.microphones).toHaveLength(1))
  })

  it('tests the microphone: level while running, silence after stopping', async () => {
    useAudioPreferencesStore.setState({ inputDeviceId: 'mic-1' })
    const { result, meter } = setup()
    await waitFor(() => expect(result.current.microphones).toHaveLength(2))
    act(() => result.current.onToggleTest())
    await waitFor(() => expect(result.current.isTesting).toBe(true))
    expect(meter.meter.start).toHaveBeenCalledWith('mic-1', expect.any(Function))
    act(() => meter.emit(0.6))
    expect(result.current.inputLevel).toBe(0.6)
    act(() => result.current.onToggleTest())
    expect(meter.stop).toHaveBeenCalledTimes(1)
    expect(result.current.isTesting).toBe(false)
    expect(result.current.inputLevel).toBe(0)
  })

  it('restarts the test on the new microphone', async () => {
    const { result, meter } = setup()
    await waitFor(() => expect(result.current.microphones).toHaveLength(2))
    act(() => result.current.onToggleTest())
    await waitFor(() => expect(result.current.isTesting).toBe(true))
    act(() => result.current.onMicrophoneChange('mic-2'))
    await waitFor(() => expect(meter.meter.start).toHaveBeenLastCalledWith('mic-2', expect.any(Function)))
    expect(meter.stop).toHaveBeenCalledTimes(1)
  })

  it('marks the permission as denied when the test cannot open the microphone', async () => {
    const { result, meter } = setup()
    await waitFor(() => expect(result.current.microphones).toHaveLength(2))
    vi.mocked(meter.meter.start).mockRejectedValueOnce(new DOMException('no', 'NotAllowedError'))
    act(() => result.current.onToggleTest())
    await waitFor(() => expect(result.current.permission).toBe('denied'))
    expect(result.current.isTesting).toBe(false)
  })

  it('stops the test and unsubscribes on unmount', async () => {
    const { result, meter, devices, unmount } = setup()
    await waitFor(() => expect(result.current.microphones).toHaveLength(2))
    act(() => result.current.onToggleTest())
    await waitFor(() => expect(result.current.isTesting).toBe(true))
    unmount()
    expect(meter.stop).toHaveBeenCalledTimes(1)
    expect(devices.listenerCount()).toBe(0)
  })
})
