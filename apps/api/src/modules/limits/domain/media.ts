import type { MediaSettings, ServerMediaOverrides } from '@gameplay/contracts'

// A server's override wins over the global setting, both ways.
export function resolveMedia(global: MediaSettings, overrides: ServerMediaOverrides | null): MediaSettings {
  return {
    sfu: overrides?.sfu ?? global.sfu,
    mesh: overrides?.mesh ?? global.mesh,
    turn: overrides?.turn ?? global.turn,
  }
}
