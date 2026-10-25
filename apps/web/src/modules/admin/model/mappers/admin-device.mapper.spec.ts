import { describe, expect, it } from 'vitest'

import { gamingDevice, sparseDevice } from '../../view-models/test/device-seed'
import { toAdminDeviceItem, toDeviceHardware } from './admin-device.mapper'

const owner = { id: 'u1', name: 'Kisnaider' }

describe('toAdminDeviceItem', () => {
  it('labels the device with the system and the browser', () => {
    expect(toAdminDeviceItem(gamingDevice, owner)).toMatchObject({
      id: 'd1',
      user: owner,
      label: 'Windows 11 · Chrome 141',
      lastSeenAt: gamingDevice.collectedAt,
    })
  })

  it('uses a dash as label when the browser reported nothing', () => {
    expect(toAdminDeviceItem(sparseDevice, owner).label).toBe('–')
  })
})

describe('toDeviceHardware', () => {
  it('maps a full report', () => {
    const hardware = toDeviceHardware(gamingDevice)
    expect(hardware.cpu).toEqual({ logicalCores: 16 })
    expect(hardware.memoryGb).toBe(8)
    expect(hardware.gpu).toEqual({ vendor: 'NVIDIA', renderer: 'RTX 3070', hardwareAcceleration: true, webgpu: true })
    expect(hardware.network).toEqual({ type: '4g', downlinkMbps: 10, rttMs: 50 })
    expect(hardware.displays).toEqual([
      { width: 2560, height: 1440, scale: 1, refreshRate: 144, isPrimary: true, label: 'Main' },
    ])
  })

  it('reads the encoders as hardware, software or unsupported', () => {
    expect(toDeviceHardware(gamingDevice).encoders).toEqual([
      { codec: 'H.264', status: 'hardware' },
      { codec: 'VP9', status: 'software' },
      { codec: 'AV1', status: 'unsupported' },
    ])
  })

  it('maps the user provided complement', () => {
    expect(toDeviceHardware(gamingDevice).userProvided).toEqual({
      cpuModel: 'Ryzen 7',
      ramGb: 32,
      gpuModel: undefined,
      vramGb: undefined,
      connection: 'wired',
      downloadMbps: 500,
      uploadMbps: undefined,
    })
  })

  it('copes with a report where everything is null', () => {
    const hardware = toDeviceHardware(sparseDevice)
    expect(hardware.cpu.logicalCores).toBeUndefined()
    expect(hardware.memoryGb).toBeUndefined()
    expect(hardware.gpu.hardwareAcceleration).toBe(false)
    expect(hardware.displays).toEqual([])
    expect(hardware.network).toBeUndefined()
    expect(hardware.userProvided).toBeUndefined()
    expect(hardware.encoders.every((encoder) => encoder.status === 'unsupported')).toBe(true)
  })
})
