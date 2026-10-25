import { InMemoryStorageProvider } from '../../storage/drivers/in-memory-storage.provider'
import { ImageProcessor } from '../../storage/images/image-processor'
import { InMemoryDeviceReportsRepository } from '../repositories/in-memory/in-memory-device-reports.repository'
import { InMemoryProfilesRepository } from '../repositories/in-memory/in-memory-profiles.repository'
import { GetMyProfileUseCase } from '../use-cases/get-my-profile.use-case'
import { ListMyDevicesUseCase } from '../use-cases/list-my-devices.use-case'
import { RemoveAvatarUseCase } from '../use-cases/remove-avatar.use-case'
import { ReportDeviceUseCase } from '../use-cases/report-device.use-case'
import { UpdateDeviceManualInfoUseCase } from '../use-cases/update-device-manual-info.use-case'
import { UpdateMyPreferencesUseCase } from '../use-cases/update-my-preferences.use-case'
import { UploadAvatarUseCase } from '../use-cases/upload-avatar.use-case'
import { SEED_PROFILE } from './accounts-seed'

// Every accounts use-case wired to in-memory fakes, over the seed profile.
export function makeAccountsContext() {
  const profiles = new InMemoryProfilesRepository()
  profiles.add({ ...SEED_PROFILE })
  const devices = new InMemoryDeviceReportsRepository()
  const storage = new InMemoryStorageProvider()
  const getProfile = new GetMyProfileUseCase(profiles)
  return {
    profiles,
    devices,
    storage,
    getProfile,
    updatePreferences: new UpdateMyPreferencesUseCase(profiles, getProfile),
    uploadAvatar: new UploadAvatarUseCase(profiles, getProfile, new ImageProcessor(), storage),
    removeAvatar: new RemoveAvatarUseCase(profiles, getProfile, storage),
    reportDevice: new ReportDeviceUseCase(devices),
    updateManual: new UpdateDeviceManualInfoUseCase(devices),
    listDevices: new ListMyDevicesUseCase(devices),
  }
}
