import type { ChannelHandlers } from '@gameplay/desktop-bridge'

import type { MainTelemetry } from '../telemetry/main-telemetry'
import type { AppAudioService } from './services/app-audio.service'

/** The channels of the audio module: they pass the call to the service, and report whether a share linked. */
export function audioHandlers(
  service: AppAudioService,
  telemetry: MainTelemetry,
): Pick<ChannelHandlers, 'audio:available' | 'audio:list-apps' | 'audio:share' | 'audio:stop'> {
  return {
    'audio:available': () => service.available(),
    'audio:list-apps': () => service.list(),
    'audio:share': (target) => {
      const linked = service.share(target)
      telemetry.measure({ name: 'audio_share', values: { linked: linked ? 1 : 0 }, attributes: { mode: target.mode } })
      return linked
    },
    'audio:stop': () => service.stop(),
  }
}
