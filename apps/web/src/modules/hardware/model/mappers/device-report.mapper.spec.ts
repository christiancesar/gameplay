import { describe, expect, it } from 'vitest'

import { collected, deviceReport, manualReport } from '../../view-models/test/hardware-seed'

import { toDeviceHardware } from './device-report.mapper'

describe('toDeviceHardware', () => {
  it('maps a full report', () => {
    expect(toDeviceHardware(deviceReport)).toEqual({
      os: { name: 'Windows', version: '15.0.0', architecture: 'x86', bitness: '64' },
      browser: { name: 'Google Chrome', version: '141' },
      cpu: { logicalCores: 16 },
      memoryGb: 8,
      gpu: {
        vendor: 'Google Inc. (NVIDIA)',
        renderer: 'ANGLE (NVIDIA GeForce RTX 3070)',
        hardwareAcceleration: true,
        webgpu: true,
      },
      encoders: [
        { codec: 'H.264', status: 'hardware' },
        { codec: 'VP9', status: 'software' },
        { codec: 'AV1', status: 'unsupported' },
      ],
      displays: [{ width: 2560, height: 1440, scale: 1, refreshRate: undefined, isPrimary: true, label: 'LG 27GL850' }],
      network: { type: '4g', downlinkMbps: 10, rttMs: 50 },
      userProvided: {},
    })
  })

  it('treats an unsupported codec as unsupported', () => {
    const report = {
      ...deviceReport,
      collected: {
        ...collected,
        videoEncoding: { ...collected.videoEncoding, h264: { supported: false, smooth: false, powerEfficient: true } },
      },
    }
    expect(toDeviceHardware(report).encoders[0]).toEqual({ codec: 'H.264', status: 'unsupported' })
  })

  it('fills the gaps of a browser that reports little', () => {
    const report = {
      ...deviceReport,
      collected: {
        os: { platform: null, version: null, architecture: null, bitness: null },
        browser: { brand: null, version: null },
        logicalCores: null,
        deviceMemoryGb: null,
        gpu: { vendor: null, renderer: null, hardwareAcceleration: null, webgpu: null },
        videoEncoding: { h264: null, vp9: null, av1: null },
        network: { effectiveType: '4g', downlinkMbps: null, rttMs: 50, saveData: null },
        displays: null,
      },
    }
    const hardware = toDeviceHardware(report)
    expect(hardware.os).toEqual({ name: '', version: undefined, architecture: undefined, bitness: undefined })
    expect(hardware.gpu.hardwareAcceleration).toBe(false)
    expect(hardware.displays).toEqual([])
    expect(hardware.network).toBeUndefined()
    expect(hardware.memoryGb).toBeUndefined()
  })

  it('carries only the manual fields the user filled in', () => {
    expect(toDeviceHardware(manualReport).userProvided).toEqual({
      cpuModel: 'Ryzen 7 5800X',
      ramGb: 32,
      vramGb: 8,
      connection: 'wired',
      downloadMbps: 500,
    })
  })
})
