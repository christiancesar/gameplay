import type { DeviceHardware } from '@/modules/hardware/model/entities/device-hardware'

export type AdminDeviceItem = {
  id: string
  user: { id: string; name: string; avatarUrl?: string }
  /** Resumo pronto para exibir, ex.: "Windows 11 · Chrome 141". */
  label: string
  lastSeenAt: string
  hardware: DeviceHardware
}

export type HardwareSummary = {
  devices: number
  minCores?: number
  minMemoryGb?: number
  accelerationPercent: number
  h264HardwarePercent: number
}
