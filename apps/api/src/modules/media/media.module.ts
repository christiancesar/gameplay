import { Module } from '@nestjs/common'
import { EnvService } from '../../env/env.service'
import { RealtimeModule } from '../realtime/realtime.module'
import { SfuController } from './controllers/sfu.controller'
import { SfuCleanupListener } from './listeners/sfu-cleanup.listener'
import { CloudflareSfuProvider } from './providers/sfu/cloudflare/cloudflare.sfu.provider'
import { NotConfiguredSfuProvider } from './providers/sfu/not-configured/not-configured.sfu.provider'
import { SfuAccessService } from './services/sfu-access.service'
import { SfuProvider } from './providers/sfu/sfu.provider'
import { ChangeSfuLayerUseCase } from './use-cases/change-sfu-layer.use-case'
import { CloseSfuTracksUseCase } from './use-cases/close-sfu-tracks.use-case'
import { CreateSfuSessionUseCase } from './use-cases/create-sfu-session.use-case'
import { GetSfuStatusUseCase } from './use-cases/get-sfu-status.use-case'
import { PublishScreenUseCase } from './use-cases/publish-screen.use-case'
import { RenegotiateSfuSessionUseCase } from './use-cases/renegotiate-sfu-session.use-case'
import { WatchScreenUseCase } from './use-cases/watch-screen.use-case'

// The SFU is on when both Cloudflare variables are set.
export function createSfuProvider(env: EnvService): SfuProvider {
  const appId = env.get('CLOUDFLARE_SFU_APP_ID')
  const appToken = env.get('CLOUDFLARE_SFU_APP_TOKEN')
  return appId && appToken ? new CloudflareSfuProvider({ appId, appToken }) : new NotConfiguredSfuProvider()
}

// Media servers behind the screen share: the Cloudflare Realtime SFU, its
// sessions and tracks. Voice stays on mesh and does not come here.
@Module({
  imports: [RealtimeModule],
  controllers: [SfuController],
  providers: [
    { provide: SfuProvider, inject: [EnvService], useFactory: createSfuProvider },
    SfuAccessService,
    SfuCleanupListener,
    GetSfuStatusUseCase,
    CreateSfuSessionUseCase,
    PublishScreenUseCase,
    WatchScreenUseCase,
    RenegotiateSfuSessionUseCase,
    ChangeSfuLayerUseCase,
    CloseSfuTracksUseCase,
  ],
})
export class MediaModule {}
