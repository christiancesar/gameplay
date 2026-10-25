import type { CONNECTION_TYPES } from '@gameplay/contracts'

export type DeviceHardware = {
  os: { name: string; version?: string; architecture?: string; bitness?: string }
  browser: { name: string; version: string }
  cpu: { logicalCores?: number }
  memoryGb?: number
  gpu: { vendor?: string; renderer?: string; hardwareAcceleration: boolean; webgpu: boolean }
  encoders: readonly { codec: 'H.264' | 'VP9' | 'AV1'; status: EncoderStatus }[]
  displays: readonly {
    width: number
    height: number
    scale: number
    refreshRate?: number
    isPrimary?: boolean
    label?: string
  }[]
  network?: { type: string; downlinkMbps: number; rttMs: number }
  /** Complemento digitado pelo usuário (o browser não expõe esses dados). */
  userProvided?: UserProvidedHardware
}

export type EncoderStatus = 'hardware' | 'software' | 'unsupported'

export type UserProvidedHardware = {
  cpuModel?: string
  ramGb?: number
  gpuModel?: string
  vramGb?: number
  connection?: ConnectionType
  downloadMbps?: number
  uploadMbps?: number
}

export type DisplaysPermission = 'granted' | 'prompt' | 'denied' | 'unsupported'

export type ConnectionType = (typeof CONNECTION_TYPES)[number]
