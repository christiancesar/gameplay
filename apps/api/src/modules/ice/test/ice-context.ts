import { StunOnlyIceProvider } from '../providers/stun-only.ice-provider'
import { GetIceConfigUseCase } from '../use-cases/get-ice-config.use-case'
import { CountingIceProvider } from './counting-ice-provider'
import { FALLBACK_STUN_URLS } from './ice-seed'

// GetIceConfig over a counting TURN provider and the seed STUN fallback.
export function makeIceContext() {
  const provider = new CountingIceProvider()
  return { provider, getIceConfig: new GetIceConfigUseCase(provider, new StunOnlyIceProvider(FALLBACK_STUN_URLS)) }
}
