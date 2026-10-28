import type { ChannelHandlers } from '@gameplay/desktop-bridge'

import type { AppAudioService } from './services/app-audio.service'

/** The channels of the audio module: they only pass the call to the service. */
export function audioHandlers(
  service: AppAudioService,
): Pick<ChannelHandlers, 'audio:available' | 'audio:list-apps' | 'audio:share' | 'audio:stop'> {
  return {
    'audio:available': () => service.available(),
    'audio:list-apps': () => service.list(),
    'audio:share': (target) => service.share(target),
    'audio:stop': () => service.stop(),
  }
}
