import type { ChannelHandlers } from '@gameplay/desktop-bridge'

import type { MainTelemetry } from '../telemetry/main-telemetry'
import type { SystemAudioService } from './services/system-audio.service'

/** The channels of the system audio module: they pass the call to the service, and report whether a capture started. */
export function systemAudioHandlers(
  service: SystemAudioService,
  telemetry: MainTelemetry,
): Pick<ChannelHandlers, 'system-audio:available' | 'system-audio:start' | 'system-audio:stop'> {
  return {
    'system-audio:available': () => service.available(),
    'system-audio:start': async () => {
      const started = await service.start()
      telemetry.measure({ name: 'system_audio_start', values: { started: started ? 1 : 0 } })
      return started
    },
    'system-audio:stop': () => service.stop(),
  }
}
