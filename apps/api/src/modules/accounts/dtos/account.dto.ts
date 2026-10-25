import {
  avatarResponseSchema,
  deviceReportSchema,
  listDevicesResponseSchema,
  manualHardwareSchema,
  type DeviceReport,
  type Profile,
  profileSchema,
  reportDeviceRequestSchema,
  updatePreferencesRequestSchema,
} from '@gameplay/shared'
import { createZodDto } from 'nestjs-zod'
import type { DeviceReportRecord, ProfileRecord } from '../domain/account'

export class ProfileDto extends createZodDto(profileSchema) {}
export class UpdatePreferencesRequestDto extends createZodDto(updatePreferencesRequestSchema) {}
export class AvatarResponseDto extends createZodDto(avatarResponseSchema) {}
export class ReportDeviceRequestDto extends createZodDto(reportDeviceRequestSchema) {}
export class ManualHardwareDto extends createZodDto(manualHardwareSchema) {}
export class DeviceReportDto extends createZodDto(deviceReportSchema) {}
export class ListDevicesResponseDto extends createZodDto(listDevicesResponseSchema) {}

export function toProfileDto({ avatarKey: _avatarKey, ...profile }: ProfileRecord): Profile {
  return profile
}

export function toDeviceReportDto(report: DeviceReportRecord): DeviceReport {
  return {
    id: report.id,
    deviceId: report.deviceId,
    collected: report.collected,
    manual: report.manual,
    collectedAt: report.collectedAt.toISOString(),
  }
}
