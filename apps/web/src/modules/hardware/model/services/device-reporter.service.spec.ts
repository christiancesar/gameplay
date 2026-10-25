import { describe, expect, it, vi } from 'vitest'

import { DEVICE_ID, collected, deviceReport } from '../../view-models/test/hardware-seed'

import { createDeviceReporter } from './device-reporter.service'

describe('device reporter', () => {
  const setup = () => {
    const collector = { collect: vi.fn(async () => collected) }
    const send = vi.fn(async () => deviceReport)
    return { collector, send, reporter: createDeviceReporter({ collector, deviceId: () => DEVICE_ID, send }) }
  }

  it('collects and sends under this browser id', async () => {
    const { reporter, collector, send } = setup()
    await expect(reporter.report({ withDisplays: true })).resolves.toEqual(deviceReport)
    expect(collector.collect).toHaveBeenCalledWith({ withDisplays: true })
    expect(send).toHaveBeenCalledWith({ deviceId: DEVICE_ID, collected })
  })

  it('does not send when the collection fails', async () => {
    const { reporter, collector, send } = setup()
    collector.collect.mockRejectedValue(new Error('boom'))
    await expect(reporter.report({ withDisplays: false })).rejects.toThrow('boom')
    expect(send).not.toHaveBeenCalled()
  })

  it('exposes the device id', () => {
    expect(setup().reporter.deviceId()).toBe(DEVICE_ID)
  })
})
