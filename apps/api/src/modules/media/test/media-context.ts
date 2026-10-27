import { makeRealtimeContext } from '../../realtime/test/realtime-context'
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

// The SFU use-cases over the realtime context (voice rooms of the realtime
// seed) and a fake SFU.
export function makeMediaContext() {
  const realtime = makeRealtimeContext()
  const { store, sfuSessions } = realtime
  const provider = new FakeSfuProvider()
  const access = new SfuAccessService(store, sfuSessions)

  return {
    ...realtime,
    provider,
    getStatus: new GetSfuStatusUseCase(provider),
    createSession: new CreateSfuSessionUseCase(provider, sfuSessions, access),
    publish: new PublishScreenUseCase(provider, sfuSessions, access),
    watch: new WatchScreenUseCase(provider, store, sfuSessions, access),
    renegotiate: new RenegotiateSfuSessionUseCase(provider, access),
    changeLayer: new ChangeSfuLayerUseCase(provider, access),
    closeTracks: new CloseSfuTracksUseCase(provider, sfuSessions, access),
    cleanup: new SfuCleanupListener(provider, sfuSessions),
  }
}
