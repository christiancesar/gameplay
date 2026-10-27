import type {
  AdminDevice,
  AdminMediaResponse,
  MediaImpact,
  ServerMediaOverrides,
  AdminServer,
  AdminServerDetail,
  AdminSession,
  AdminUser,
  DeviceReport,
  HardwareSummary,
  PlatformSettings,
  RegistrationInvite,
} from '@gameplay/contracts'

import {
  activeInvite,
  adminServer,
  adminServerDetail,
  adminSession,
  adminUser,
  platformSettings,
  suspendedUser,
  usedInvite,
} from './admin-seed'
import { adminGamingDevice, gamingDevice } from './device-seed'
import { adminMedia, mediaImpact, serverMediaOverrides } from './media-seed'

/** What the fake API answers on each admin GET. Specs override the parts they care about. */
type AdminResponses = {
  users: AdminUser[]
  sessionsByUser: Record<string, AdminSession[]>
  devicesByUser: Record<string, DeviceReport[]>
  devices: AdminDevice[]
  servers: AdminServer[]
  serverDetail: AdminServerDetail
  summary: HardwareSummary
  settings: PlatformSettings
  invites: RegistrationInvite[]
  media: AdminMediaResponse
  impact: MediaImpact
  serverMedia: ServerMediaOverrides
}

const defaultResponses: AdminResponses = {
  users: [adminUser, suspendedUser],
  sessionsByUser: { [adminUser.id]: [adminSession], [suspendedUser.id]: [] },
  devicesByUser: { [adminUser.id]: [gamingDevice], [suspendedUser.id]: [] },
  devices: [adminGamingDevice],
  servers: [adminServer],
  serverDetail: adminServerDetail,
  summary: {
    devices: 1,
    minLogicalCores: 16,
    minDeviceMemoryGb: 8,
    hardwareAccelerationPercent: 100,
    h264HardwarePercent: 100,
  },
  settings: platformSettings,
  invites: [activeInvite, usedInvite],
  media: adminMedia,
  impact: mediaImpact,
  serverMedia: serverMediaOverrides,
}

export { defaultResponses }
export type { AdminResponses }
