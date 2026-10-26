import type { AdminDevice, DeviceReport } from '@gameplay/contracts'

const codec = (supported: boolean, powerEfficient: boolean) => ({ supported, smooth: supported, powerEfficient })

const gamingDevice: DeviceReport = {
  id: 'd1',
  deviceId: '5b0c8a3e-2f4a-4b8e-9f3a-111111111111',
  collectedAt: '2026-10-25T10:00:00.000Z',
  collected: {
    os: { platform: 'Windows', version: '11', architecture: 'x86', bitness: '64' },
    browser: { brand: 'Chrome', version: '141' },
    logicalCores: 16,
    deviceMemoryGb: 8,
    gpu: { vendor: 'NVIDIA', renderer: 'RTX 3070', hardwareAcceleration: true, webgpu: true },
    videoEncoding: { h264: codec(true, true), vp9: codec(true, false), av1: null },
    network: { effectiveType: '4g', downlinkMbps: 10, rttMs: 50, saveData: false },
    displays: [
      {
        label: 'Main',
        width: 2560,
        height: 1440,
        scaleFactor: 1,
        refreshRate: 144,
        isPrimary: true,
        isInternal: false,
      },
    ],
  },
  manual: {
    cpuModel: 'Ryzen 7',
    ramGb: 32,
    gpuModel: null,
    vramGb: null,
    connectionType: 'wired',
    internetDownloadMbps: 500,
    internetUploadMbps: null,
  },
}

/** A device that reported almost nothing, as some browsers do. */
const sparseDevice: DeviceReport = {
  id: 'd2',
  deviceId: '5b0c8a3e-2f4a-4b8e-9f3a-222222222222',
  collectedAt: '2026-10-24T10:00:00.000Z',
  collected: {
    os: { platform: null, version: null, architecture: null, bitness: null },
    browser: { brand: null, version: null },
    logicalCores: null,
    deviceMemoryGb: null,
    gpu: { vendor: null, renderer: null, hardwareAcceleration: null, webgpu: null },
    videoEncoding: { h264: null, vp9: null, av1: null },
    network: { effectiveType: null, downlinkMbps: null, rttMs: null, saveData: null },
    displays: null,
  },
  manual: null,
}

const toAdminDevice = (report: DeviceReport, user: AdminDevice['user']): AdminDevice => ({
  user,
  deviceId: report.deviceId,
  collected: report.collected,
  manual: report.manual,
  collectedAt: report.collectedAt,
})

/** Rows of `GET /admin/hardware/devices`, newest first. */
const adminGamingDevice = toAdminDevice(gamingDevice, { id: 'u1', username: 'kisnaider' })
const adminSparseDevice = toAdminDevice(sparseDevice, { id: 'u1', username: 'kisnaider' })

export { adminGamingDevice, adminSparseDevice, gamingDevice, sparseDevice }
