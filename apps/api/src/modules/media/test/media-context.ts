import { InMemoryNotificationsRepository } from '../../notifications/repositories/in-memory/in-memory-notifications.repository'
import { InMemoryRecipientsRepository } from '../../notifications/repositories/in-memory/in-memory-recipients.repository'
import { SendAnnouncementUseCase } from '../../notifications/use-cases/send-announcement.use-case'
import { makeRealtimeContext } from '../../realtime/test/realtime-context'
import { InMemoryMediaUsageRepository } from '../repositories/in-memory/in-memory-media-usage.repository'
import { MediaChangeService } from '../services/media-change.service'
import { SfuBudgetService } from '../services/sfu-budget.service'
import { RealtimeUsageService } from '../services/realtime-usage.service'
import { NotConfiguredRealtimeUsageProvider } from '../providers/realtime-usage/not-configured/not-configured.realtime-usage.provider'
import { SfuUsageListener } from '../listeners/sfu-usage.listener'
import { GetMediaImpactUseCase } from '../use-cases/get-media-impact.use-case'
import { GetServerMediaUseCase } from '../use-cases/get-server-media.use-case'
import { UpdateMediaSettingsUseCase } from '../use-cases/update-media-settings.use-case'
import { UpdateServerMediaUseCase } from '../use-cases/update-server-media.use-case'
import { SfuCleanupListener } from '../listeners/sfu-cleanup.listener'
import { SfuAccessService } from '../services/sfu-access.service'
import { ChangeSfuLayerUseCase } from '../use-cases/change-sfu-layer.use-case'
import { CloseSfuTracksUseCase } from '../use-cases/close-sfu-tracks.use-case'
import { CreateSfuSessionUseCase } from '../use-cases/create-sfu-session.use-case'
import { GetSfuStatusUseCase } from '../use-cases/get-sfu-status.use-case'
import { PublishScreenUseCase } from '../use-cases/publish-screen.use-case'
import { RenegotiateSfuSessionUseCase } from '../use-cases/renegotiate-sfu-session.use-case'
import { WatchScreenUseCase } from '../use-cases/watch-screen.use-case'
import { FakeSfuProvider } from './fake-sfu-provider'
import { SEED_USER_IDS } from './media-seed'

// The SFU use-cases over the realtime context (voice rooms of the realtime
// seed) and a fake SFU.
export function makeMediaContext() {
  const realtime = makeRealtimeContext()
  const { store, sfuSessions, effectiveMedia, mediaSettings, servers, events } = realtime
  for (const serverId of servers.servers.keys()) mediaSettings.addServer(serverId)
  const notifications = new InMemoryNotificationsRepository()
  const recipients = new InMemoryRecipientsRepository()
  for (const userId of SEED_USER_IDS) recipients.userIds.add(userId)
  const announce = new SendAnnouncementUseCase(notifications, recipients, servers, events)
  const change = new MediaChangeService(mediaSettings, store, events, announce)
  const usage = new InMemoryMediaUsageRepository()
  const budget = new SfuBudgetService(
    usage,
    mediaSettings,
    new RealtimeUsageService(new NotConfiguredRealtimeUsageProvider()),
  )
  const provider = new FakeSfuProvider()
  const access = new SfuAccessService(store, sfuSessions)

  return {
    ...realtime,
    provider,
    getStatus: new GetSfuStatusUseCase(provider, budget),
    createSession: new CreateSfuSessionUseCase(provider, sfuSessions, access, effectiveMedia),
    publish: new PublishScreenUseCase(provider, sfuSessions, access, effectiveMedia, budget),
    watch: new WatchScreenUseCase(provider, store, sfuSessions, access),
    renegotiate: new RenegotiateSfuSessionUseCase(provider, access),
    changeLayer: new ChangeSfuLayerUseCase(provider, access),
    closeTracks: new CloseSfuTracksUseCase(provider, sfuSessions, access),
    cleanup: new SfuCleanupListener(provider, sfuSessions),
    notifications,
    usage,
    budget,
    usageListener: new SfuUsageListener(budget),
    updateMediaSettings: new UpdateMediaSettingsUseCase(mediaSettings, change),
    updateServerMedia: new UpdateServerMediaUseCase(mediaSettings, change),
    impact: new GetMediaImpactUseCase(change, mediaSettings),
    serverMedia: new GetServerMediaUseCase(realtime.access, effectiveMedia, provider, budget),
  }
}
