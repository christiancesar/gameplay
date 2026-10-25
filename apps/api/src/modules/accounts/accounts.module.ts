import { Module } from '@nestjs/common'
import { MyDevicesController } from './controllers/my-devices.controller'
import { MyProfileController } from './controllers/my-profile.controller'
import { DeviceReportsRepository } from './repositories/device-reports.repository'
import { PrismaDeviceReportsRepository } from './repositories/prisma/prisma-device-reports.repository'
import { PrismaProfilesRepository } from './repositories/prisma/prisma-profiles.repository'
import { ProfilesRepository } from './repositories/profiles.repository'
import { GetMyProfileUseCase } from './use-cases/get-my-profile.use-case'
import { ListMyDevicesUseCase } from './use-cases/list-my-devices.use-case'
import { RemoveAvatarUseCase } from './use-cases/remove-avatar.use-case'
import { ReportDeviceUseCase } from './use-cases/report-device.use-case'
import { UpdateDeviceManualInfoUseCase } from './use-cases/update-device-manual-info.use-case'
import { UpdateMyPreferencesUseCase } from './use-cases/update-my-preferences.use-case'
import { UploadAvatarUseCase } from './use-cases/upload-avatar.use-case'

// The signed-in user's own account: profile, theme and language, avatar and
// the hardware of each device.
@Module({
  controllers: [MyProfileController, MyDevicesController],
  providers: [
    { provide: ProfilesRepository, useClass: PrismaProfilesRepository },
    { provide: DeviceReportsRepository, useClass: PrismaDeviceReportsRepository },
    GetMyProfileUseCase,
    UpdateMyPreferencesUseCase,
    UploadAvatarUseCase,
    RemoveAvatarUseCase,
    ReportDeviceUseCase,
    UpdateDeviceManualInfoUseCase,
    ListMyDevicesUseCase,
  ],
  // For the platform admin panel (devices per user).
  exports: [DeviceReportsRepository],
})
export class AccountsModule {}
