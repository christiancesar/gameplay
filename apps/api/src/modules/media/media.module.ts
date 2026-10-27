import { Module } from '@nestjs/common'
import { EnvService } from '../../env/env.service'
import { IceModule } from '../ice/ice.module'
import { LimitsModule } from '../limits/limits.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { RealtimeModule } from '../realtime/realtime.module'
import { ServersModule } from '../servers/servers.module'
import { AdminMediaController } from './controllers/admin-media.controller'
import { ServerMediaController } from './controllers/server-media.controller'
import { SfuController } from './controllers/sfu.controller'
import { SfuCleanupListener } from './listeners/sfu-cleanup.listener'
import { SfuUsageListener } from './listeners/sfu-usage.listener'
import { MediaUsageRepository } from './repositories/media-usage.repository'
import { PrismaMediaUsageRepository } from './repositories/prisma/prisma-media-usage.repository'
import { SfuBudgetService } from './services/sfu-budget.service'
import { RealtimeUsageService } from './services/realtime-usage.service'
import { RealtimeUsageProvider } from './providers/realtime-usage/realtime-usage.provider'
import { CloudflareRealtimeUsageProvider } from './providers/realtime-usage/cloudflare/cloudflare.realtime-usage.provider'
import { NotConfiguredRealtimeUsageProvider } from './providers/realtime-usage/not-configured/not-configured.realtime-usage.provider'
import { UpdateSfuBudgetUseCase } from './use-cases/update-sfu-budget.use-case'
import { CloudflareSfuProvider } from './providers/sfu/cloudflare/cloudflare.sfu.provider'
import { NotConfiguredSfuProvider } from './providers/sfu/not-configured/not-configured.sfu.provider'
import { MediaChangeService } from './services/media-change.service'
import { SfuAccessService } from './services/sfu-access.service'
import { SfuProvider } from './providers/sfu/sfu.provider'
import { ChangeSfuLayerUseCase } from './use-cases/change-sfu-layer.use-case'
import { CloseSfuTracksUseCase } from './use-cases/close-sfu-tracks.use-case'
import { CreateSfuSessionUseCase } from './use-cases/create-sfu-session.use-case'
import { GetAdminMediaUseCase } from './use-cases/get-admin-media.use-case'
import { GetMediaImpactUseCase } from './use-cases/get-media-impact.use-case'
import { GetServerMediaOverridesUseCase } from './use-cases/get-server-media-overrides.use-case'
import { GetServerMediaUseCase } from './use-cases/get-server-media.use-case'
import { GetSfuStatusUseCase } from './use-cases/get-sfu-status.use-case'
import { UpdateMediaSettingsUseCase } from './use-cases/update-media-settings.use-case'
import { UpdateServerMediaUseCase } from './use-cases/update-server-media.use-case'
import { PublishScreenUseCase } from './use-cases/publish-screen.use-case'
import { RenegotiateSfuSessionUseCase } from './use-cases/renegotiate-sfu-session.use-case'
import { WatchScreenUseCase } from './use-cases/watch-screen.use-case'

// The SFU is on when both Cloudflare variables are set.
export function createSfuProvider(env: EnvService): SfuProvider {
  const appId = env.get('CLOUDFLARE_SFU_APP_ID')
  const appToken = env.get('CLOUDFLARE_SFU_APP_TOKEN')
  return appId && appToken ? new CloudflareSfuProvider({ appId, appToken }) : new NotConfiguredSfuProvider()
}

// Cloudflare's analytics, when the account id and the token are set. The TURN
// key only counts when the relay really is Cloudflare's.
export function createRealtimeUsageProvider(env: EnvService): RealtimeUsageProvider {
  const accountId = env.get('CLOUDFLARE_ACCOUNT_ID')
  const apiToken = env.get('CLOUDFLARE_ANALYTICS_TOKEN')
  if (!accountId || !apiToken) return new NotConfiguredRealtimeUsageProvider()
  return new CloudflareRealtimeUsageProvider({
    accountId,
    apiToken,
    sfuAppId: env.get('CLOUDFLARE_SFU_APP_ID') || undefined,
    turnKeyId: env.get('ICE_PROVIDER') === 'cloudflare' ? env.get('CLOUDFLARE_TURN_KEY_ID') || undefined : undefined,
  })
}

// Media servers behind the screen share: the Cloudflare Realtime SFU, its
// sessions and tracks. Voice stays on mesh and does not come here. Also the
// platform admin's switches for SFU, mesh and TURN, and their effects.
@Module({
  imports: [RealtimeModule, LimitsModule, ServersModule, NotificationsModule, IceModule],
  controllers: [SfuController, AdminMediaController, ServerMediaController],
  providers: [
    { provide: SfuProvider, inject: [EnvService], useFactory: createSfuProvider },
    { provide: MediaUsageRepository, useClass: PrismaMediaUsageRepository },
    SfuBudgetService,
    { provide: RealtimeUsageProvider, inject: [EnvService], useFactory: createRealtimeUsageProvider },
    RealtimeUsageService,
    SfuUsageListener,
    UpdateSfuBudgetUseCase,
    SfuAccessService,
    MediaChangeService,
    GetAdminMediaUseCase,
    GetMediaImpactUseCase,
    UpdateMediaSettingsUseCase,
    GetServerMediaOverridesUseCase,
    UpdateServerMediaUseCase,
    GetServerMediaUseCase,
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
