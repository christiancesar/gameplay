import { MEDIA_RESOURCES, type MediaResource, type MediaSettings, type ServerMediaOverrides } from '@gameplay/contracts'

/** O valor em vigor: o do servidor quando existe, senão o global. */
function effectiveMedia(globals: MediaSettings, overrides?: ServerMediaOverrides): MediaSettings {
  return {
    sfu: overrides?.sfu ?? globals.sfu,
    mesh: overrides?.mesh ?? globals.mesh,
    turn: overrides?.turn ?? globals.turn,
  }
}

/** Recursos que estavam ligados e passam a desligados: pedem confirmação. */
function mediaGoingOff(before: MediaSettings, after: MediaSettings): MediaResource[] {
  return MEDIA_RESOURCES.filter((resource) => before[resource] && !after[resource])
}

export { effectiveMedia, mediaGoingOff }
