// Hardware fictício de dispositivos, usado só nas stories.
import type { DeviceHardware } from '@/modules/hardware/views/device-hardware.view'

export const gamingPc: DeviceHardware = {
  os: { name: 'Windows', version: '11', architecture: 'x86', bitness: '64' },
  browser: { name: 'Chrome', version: '141' },
  cpu: { logicalCores: 16 },
  memoryGb: 8,
  gpu: { vendor: 'NVIDIA', renderer: 'NVIDIA GeForce RTX 3070 (D3D11)', hardwareAcceleration: true, webgpu: true },
  encoders: [
    { codec: 'H.264', status: 'hardware' },
    { codec: 'VP9', status: 'hardware' },
    { codec: 'AV1', status: 'software' },
  ],
  displays: [
    { label: 'LG 27GL850', width: 2560, height: 1440, scale: 1, refreshRate: 144, isPrimary: true },
    { label: 'Dell P2419H', width: 1920, height: 1080, scale: 1, refreshRate: 60 },
  ],
  network: { type: '4g', downlinkMbps: 10, rttMs: 50 },
}

export const oldNotebook: DeviceHardware = {
  os: { name: 'Windows', version: '10', architecture: 'x86', bitness: '64' },
  browser: { name: 'Edge', version: '140' },
  cpu: { logicalCores: 4 },
  memoryGb: 4,
  gpu: { vendor: 'Google', renderer: 'SwiftShader (software)', hardwareAcceleration: false, webgpu: false },
  encoders: [
    { codec: 'H.264', status: 'software' },
    { codec: 'VP9', status: 'software' },
    { codec: 'AV1', status: 'unsupported' },
  ],
  displays: [{ width: 1366, height: 768, scale: 1 }],
  network: { type: '3g', downlinkMbps: 1.4, rttMs: 300 },
}

export const macbook: DeviceHardware = {
  os: { name: 'macOS', version: '15.4', architecture: 'arm', bitness: '64' },
  browser: { name: 'Chrome', version: '141' },
  cpu: { logicalCores: 8 },
  memoryGb: 8,
  gpu: { vendor: 'Apple', renderer: 'Apple M2', hardwareAcceleration: true, webgpu: true },
  encoders: [
    { codec: 'H.264', status: 'hardware' },
    { codec: 'VP9', status: 'software' },
    { codec: 'AV1', status: 'unsupported' },
  ],
  displays: [
    { label: 'Built-in Retina Display', width: 1512, height: 982, scale: 2, refreshRate: 120, isPrimary: true },
  ],
}
