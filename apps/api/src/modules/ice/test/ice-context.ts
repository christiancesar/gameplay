import { makeLimitsContext } from '../../limits/test/limits-context'
import { TurnRevocationListener } from '../listeners/turn-revocation.listener'
import { StunOnlyIceProvider } from '../providers/ice/stun-only/stun-only.ice.provider'
import { GetIceConfigUseCase } from '../use-cases/get-ice-config.use-case'
import { CountingIceProvider } from './counting-ice-provider'
import { FALLBACK_STUN_URLS } from './ice-seed'

// GetIceConfig over a counting TURN provider and the seed STUN fallback.
export function makeIceContext() {
  const provider = new CountingIceProvider()
  const { mediaSettings, effectiveMedia } = makeLimitsContext()
  const getIceConfig = new GetIceConfigUseCase(
    provider,
    new StunOnlyIceProvider(FALLBACK_STUN_URLS),
    effectiveMedia,
    mediaSettings,
  )
  return { provider, mediaSettings, getIceConfig, listener: new TurnRevocationListener(getIceConfig) }
}
