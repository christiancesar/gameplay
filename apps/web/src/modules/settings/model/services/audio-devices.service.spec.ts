import { describe, expect, it } from 'vitest'

import { createFakeAudioBrowser, type FakeDevice } from '../../view-models/test/fake-audio-browser'

import { createAudioDevicesService } from './audio-devices.service'

const DEVICES: FakeDevice[] = [
  { deviceId: 'default', kind: 'audioinput', label: 'Default - Headset' },
  { deviceId: 'mic-1', kind: 'audioinput', label: 'Headset Mic' },
  { deviceId: 'mic-2', kind: 'audioinput', label: '' },
  { deviceId: 'out-1', kind: 'audiooutput', label: 'Headset' },
  { deviceId: 'cam-1', kind: 'videoinput', label: 'Webcam' },
]

describe('audio devices service', () => {
  it('splits inputs and outputs, skips the alias entries and names unlabeled devices', async () => {
    const browser = createFakeAudioBrowser(DEVICES)
    const service = createAudioDevicesService(browser)
    await expect(service.list()).resolves.toEqual({
      microphones: [
        { id: 'mic-1', label: 'Headset Mic' },
        { id: 'mic-2', label: 'Microphone 2' },
      ],
      outputs: [{ id: 'out-1', label: 'Headset' }],
    })
  })

  it('reads the permission from the Permissions API', async () => {
    const service = createAudioDevicesService(createFakeAudioBrowser(DEVICES, 'denied'))
    await expect(service.queryPermission()).resolves.toBe('denied')
  })

  it('infers the permission from device labels when the name is unknown', async () => {
    const granted = createAudioDevicesService(createFakeAudioBrowser(DEVICES, 'unsupported'))
    await expect(granted.queryPermission()).resolves.toBe('granted')
    const blank = createAudioDevicesService(
      createFakeAudioBrowser([{ deviceId: 'a', kind: 'audioinput', label: '' }], 'unsupported'),
    )
    await expect(blank.queryPermission()).resolves.toBe('prompt')
  })

  it('is denied without mediaDevices', async () => {
    const service = createAudioDevicesService({})
    await expect(service.queryPermission()).resolves.toBe('denied')
    await expect(service.requestPermission()).resolves.toBe('denied')
    await expect(service.list()).resolves.toEqual({ microphones: [], outputs: [] })
  })

  it('requests access and releases the stream right away', async () => {
    const browser = createFakeAudioBrowser(DEVICES)
    const service = createAudioDevicesService(browser)
    await expect(service.requestPermission()).resolves.toBe('granted')
    expect(browser.spies.getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(browser.track.stop).toHaveBeenCalledTimes(1)
  })

  it('reports a refused request as denied', async () => {
    const browser = createFakeAudioBrowser(DEVICES)
    browser.spies.getUserMedia.mockRejectedValue(new DOMException('no', 'NotAllowedError'))
    await expect(createAudioDevicesService(browser).requestPermission()).resolves.toBe('denied')
  })

  it('notifies device changes until unsubscribed', () => {
    const browser = createFakeAudioBrowser(DEVICES)
    const service = createAudioDevicesService(browser)
    let calls = 0
    const unsubscribe = service.onChange(() => (calls += 1))
    browser.emitDeviceChange()
    unsubscribe()
    browser.emitDeviceChange()
    expect(calls).toBe(1)
  })
})
